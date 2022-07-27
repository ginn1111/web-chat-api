const router = require('express').Router();
const Message = require('../models/Message');

const { verifyTokenAndAuthorization } = require('./verify');

// [POST/SEND NEW MESSAGE]
router.post('/:id/create', verifyTokenAndAuthorization, async (req, res) => {
    try {
        const newMessage = new Message({
            conversationId: req.body.conversationId,
            senderId: req.params.id,
            text: req.body.text,
        });
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (error) {
        res.status(500).json(error);
    }
});

// [GET ALL MESSAGE OF A CONVERSATION]
router.get(
    '/:id/get/:conversationId',
    verifyTokenAndAuthorization,
    async (req, res) => {
        try {
            const messages = await Message.find({
                conversationId: req.params.conversationId,
            });
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json(error);
        }
    },
);

// [DELETE MESSAGE]
router.delete(
    '/:id/delete/:messageId',
    verifyTokenAndAuthorization,
    async (req, res) => {
        try {
            await Message.findByIdAndDelete(req.params.messageId);
            res.status(200).json('Deleted successfully!');
        } catch (error) {
            res.status(500).json(error);
        }
    },
);

module.exports = router;
