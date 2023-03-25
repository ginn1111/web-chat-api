const router = require('express').Router();
const Conversation = require('../models/Conversation');
const {
  getInformationForGroupConversation,
  getInformationForPrivateConversation,
} = require('../utils/helper');

const { verifyToken, verifyTokenAndAuthorization } = require('./verify');

// [NEW CONVERSATION] --> OK
const createNewConversation = async ({
  isGroup = false,
  title = "Don't have name!",
  members,
}) => {
  // Check if the request query has <group> or not,
  // default is 'false' - private conversation
  const newConversation = new Conversation({
    members,
    isGroup,
    title,
  });
  // Save new conversation to db
  let savedConversation = await newConversation.save();
  savedConversation = {
    ...savedConversation._doc,
    members: members,
    fromOnline: Date.now(),
  };

  return savedConversation;
};

router.post('/:id/create', verifyTokenAndAuthorization, async (req, res) => {
  const qCreateGroup = req.query.group || 'false';
  const data = {
    members: req.body.members,
    isGroup: JSON.parse(qCreateGroup),
    title: req.body.title,
  };
  try {
    const savedConversation = createNewConversation(data);
    res.status(200).json(savedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [GET ALL CONVERSATIONS] --> OK
router.get('/:id/get', verifyTokenAndAuthorization, async (req, res) => {
  const userId = req.params.id;
  try {
    let conversations = await Conversation.find({ 'members.memberId': userId });
    conversations = await Promise.all(
      conversations.map((conversation) => {
        if (conversation.isGroup) {
          return getInformationForGroupConversation(conversation);
        }
        return getInformationForPrivateConversation(conversation, userId);
      })
    );
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [ADD NEW MEMBER INTO GROUP CONVERSATION] --> OK
router.put('/:conversationId/add-member/', verifyToken, async (req, res) => {
  try {
    // Get group conversation from db with conversationId
    const conversation = await Conversation.findById(req.params.conversationId);
    // Flag to check if the added user is already in this group
    const isAlreadyInGroup = conversation.members.some(
      (member) => member.memberId === req.body.newMembers.memberId
    );
    // If yes, send error
    if (isAlreadyInGroup) {
      return res.status(409).json('This user has already been in this group!');
    }
    // Otherwise add user to this group
    let updatedConversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        $push: { members: req.body.newMembers },
      },
      { new: true }
    );
    updatedConversation = await getAvatarMemberForGroupConversation(
      updatedConversation
    );
    res.status(200).json(updatedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [CHANGE THEME FOR CONVERSATION]
router.put('/:conversationId/theme', verifyToken, async (req, res) => {
  try {
    const updatedConversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

//[UPDATE FROM TIME ONLINE] --> OK
router.put(`/:conversationId/update-time`, verifyToken, async (req, res) => {
  try {
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      $set: req.body,
    });
    console.log('update');
    res.status(200).json('Success');
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const deleteConversation = (conversationId) =>
  Conversation.findByIdAndDelete(conversationId);
// [DELETE CONVERSATION] --> OK
router.delete('/:conversationId/delete', verifyToken, async (req, res) => {
  try {
    const deletedConversation = await deleteConversation(
      req.params.conversationId
    );
    res.status(200).json(deletedConversation._id);
  } catch (error) {
    res.status(500).json(error);
  }
});
router.createNewConversation = createNewConversation;
router.deleteConversation = deleteConversation;
module.exports = router;
