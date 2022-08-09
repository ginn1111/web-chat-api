const mongoose = require('mongoose');
const ConversationSchema = new mongoose.Schema(
  {
    theme: { type: String, default: 'default' },
    members: [
      {
        memberId: { type: String },
        nickname: { type: String, default: '' },
      },
    ],
    isGroup: { type: Boolean, default: false },
    title: { type: String, default: "Don't have name!" },
    fromOnline: { type: Number, default: Date.now() },
    lastMsg: {
      text: { type: String, default: "Let's chat!" },
      senderId: {type: String, default: null},
      createdAt: {type: String, default: null},
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Conversation', ConversationSchema);
