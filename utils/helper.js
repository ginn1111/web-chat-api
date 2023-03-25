const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const getLastMsg = async (conversationId) =>
  await Message.find({
    conversationId: conversationId,
  })
    .sort({ _id: -1 })
    .limit(1);

const getLastMsgAndMemberForConversation = async (conversation) => {
  const members = await Promise.all(
    conversation.members.map(async (mem) => {
      const avatar = (await User.findById(mem.memberId)).avatar;
      return { ...mem._doc, avatar };
    })
  );
  const lastMsg = await getLastMsg(conversation._id);
  return {
    ...conversation._doc,
    members,
    lastMsg: lastMsg?.[0] ?? {
      text: "Let's chat!",
      senderId: null,
      createdAt: null,
    },
  };
};

const getInformationForGroupConversation = (conversation) =>
  getAvatarMemberConversationList(conversation);

const getInformationForPrivateConversation = async (conversation) => {
  const privateConversation = await getLastMsgAndMemberForConversation(
    conversation
  );

  const member = privateConversation.members.find(
    (mem) => mem.memberId !== userId
  );

  return {
    ...privateConversation,
    title: member.nickname,
    avatar: member.avatar,
  };
};

const deleteConversationByMembers = async (memberIds) => {
  memberIds = memberIds.map((memberId) => ({ $elemMatch: { memberId } }));
  const deletedConversation = await Conversation.deleteMany({
    members: {
      $all: memberIds,
      $size: 2,
    },
  });

  return deletedConversation;
};

module.exports = {
  getInformationForGroupConversation,
  getInformationForPrivateConversation,
  deleteConversationByMembers,
};
