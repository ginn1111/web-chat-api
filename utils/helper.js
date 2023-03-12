const User = require('../models/User');
const Message = require('../models/Message');

const getLastMsg = async (conversationId) =>
  await Message.find({
    conversationId: conversationId,
  })
    .sort({ _id: -1 })
    .limit(1);

const getAvatarMemberForGroupConversation = async (conversation) => {
  const members = await Promise.all(
    conversation?.members?.map(async (mem) => {
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

const getAvatarMemberConversationList = async (conversations) => {
  return await Promise.all(
    conversations?.map(async (con) => {
      const conWithNewMembersAndLastMsg =
        await getAvatarMemberForGroupConversation(con);
      return {
        ...conWithNewMembersAndLastMsg,
      };
    })
  );
};
const getLastMsgAndInforForPrivateConversation = async (
  conversations,
  userId
) => {
  return await Promise.all(
    conversations.map(async (conversation) => {
      const conWithNewMembersAndLastMsg =
        await getAvatarMemberForGroupConversation(conversation);

      const member = conWithNewMembersAndLastMsg.members.find(
        (mem) => mem.memberId !== userId
      );

      return {
        ...conWithNewMembersAndLastMsg,
        title: member.nickname,
        avatar: member.avatar,
      };
    })
  );
};

module.exports = {
  getLastMsgAndInforForPrivateConversation,
  getAvatarMemberConversationList,
  getAvatarMemberForGroupConversation,
};
