const router = require('express').Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const { verifyToken, verifyTokenAndAuthorization } = require('./verify');

// [NEW CONVERSATION]
router.post('/:id/create', verifyTokenAndAuthorization, async (req, res) => {
  // Check if the request query has <group> or not,
  // default is 'false' - private conversation
  const qCreateGroup = req.query.group || 'false';
  const newConversation = new Conversation({
    members: [...req.body.members],
    isGroup: JSON.parse(qCreateGroup),
  });
  try {
    // Save new conversation to db
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [GET ALL CONVERSATIONS]
router.get('/:id/get', verifyTokenAndAuthorization, async (req, res) => {
  const qIsGroup = req.query.isGroup;
  const userId = req.params.id;
  try {
    let conversations;
    if (qIsGroup) {
      conversations = await Conversation.find({
        'members.memberId': userId,
        isGroup: JSON.parse(qIsGroup),
      });
    } else {
      conversations = await Conversation.find({
        'members.memberId': userId,
      });
      conversations = await Promise.all(
        conversations.map(async (conversation) => {
          const member = conversation.members.filter(
            (mem) => mem.memberId !== userId,
          )[0];
          const memberInfor = await User.findById(member.memberId);
          return {
            ...conversation._doc,
            title: `${memberInfor.firstName} ${memberInfor.lastName}`,
            avatar: memberInfor.avatar,
          };
        }),
      );
    }
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [ADD NEW MEMBER INTO GROUP CONVERSATION]
router.put('/:conversationId/add-member/', verifyToken, async (req, res) => {
  try {
    // Get group conversation from db with conversationId
    const conversation = await Conversation.findById(req.params.conversationId);
    // Flag to check if the added user is already in this group
    const isAlreadyInGroup = conversation.members.some(
      (member) => member.memberId === req.body.newMember.memberId,
    );
    // If yes, send error
    if (isAlreadyInGroup) {
      return res.status(409).json('This user has already been in this group!');
    }
    // Otherwise add user to this group
    const updatedConversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        $push: { members: req.body.newMember },
      },
      { new: true },
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
      { new: true },
    );
    res.status(200).json(updatedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

//[UPDATE FROM TIME ONLINE]
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

// [DELETE CONVERSATION]
router.delete('/:conversationId/delete', verifyToken, async (req, res) => {
  try {
    const deletedConversation = await Conversation.findByIdAndDelete(
      req.params.conversationId,
    );
    res.status(200).json(deletedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
