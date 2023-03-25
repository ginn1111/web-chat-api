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
    conversation.members.map(async (member) => {
      const avatar = (await User.findById(member.memberId)).avatar;
      const { _id, ...rest } = member._doc;
      return { ...rest, avatar };
    })
  );
  const lastMsg = await getLastMsg(conversation._id);
  const { __v, _id: id, createdAt, updatedAt, ...rest } = conversation._doc;
  return {
    id,
    ...rest,
    members,
    lastMsg: lastMsg?.[0] ?? {
      text: "Let's chat!",
      senderId: null,
      createdAt: null,
    },
  };
};

const getInformationForGroupConversation = async (conversation) => {
  const groupConversation = await getLastMsgAndMemberForConversation(
    conversation
  );

  const avatars = groupConversation.members
    .slice(0, 3)
    .map(({ avatar }) => avatar);

  const title = groupConversation.members
    .map(({ nickname }) => nickname)
    .join(', ');

  return {
    ...groupConversation,
    title,
    avatars,
  };
};

const getInformationForPrivateConversation = async (conversation, userId) => {
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
