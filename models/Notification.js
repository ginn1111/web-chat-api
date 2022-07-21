const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema(
    {
        senderId: { type: String },
        senderName: { type: String },
        senderAvatar: { type: String },
        receiverId: { type: String },
        notify: { type: String },
        isResponse: { type: Boolean, default: false },
    },
    { timestamps: true },
);
module.exports = mongoose.model('Notification', NotificationSchema);
