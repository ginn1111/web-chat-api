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
    fromOnline: { type: Number, default: new Date().getTime() },
    lastMsg: { type: String, default: "Let's chat!" },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Conversation', ConversationSchema);
