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
    },
    { timestamps: true },
);
module.exports = mongoose.model('Conversation', ConversationSchema);
