const router = require('express').Router();
const Notification = require('../models/Notification');
const { verifyTokenAndAuthorization } = require('./verify');

// [CREATE NEW NOTIFICATION]
router.post('/:id/create', verifyTokenAndAuthorization, async (req, res) => {
  const newNotify = new Notification({
    senderId: req.body.senderId,
    senderName: req.body.senderName,
    senderAvatar: req.body.senderAvatar,
    receiverId: req.body.receiverId,
    notify: req.body.notify,
    isResponse: req.body.isResponse,
  });
  try {
    const savedNotify = await newNotify.save();
    res.status(200).json(savedNotify._doc._id);
  } catch (error) {
    res.status(500).json(error);
  }
});
// [GET ALL USER'S NOTIFICATIONS]
router.get('/:id/get', verifyTokenAndAuthorization, async (req, res) => {
  try {
    const notify = await Notification.find({
      receiverId: req.params.id,
    });
    res.status(200).json(notify);
  } catch (error) {
    res.status(500).json(error);
  }
});
// [UPDATE NOTIFICATION]
router.put(
  '/:id/edit/:notifyId',
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const updatedNotify = await Notification.findByIdAndUpdate(
        req.params.notifyId,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedNotify);
    } catch (error) {
      res.status(500).json(error);
    }
  }
);
// [DELETE 1 NOTIFICATION]
router.delete(
  '/:id/delete/:notifyId',
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      await Notification.findOneAndDelete(req.params.notifyId);
      res.status(200).json('Delete successfully!');
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

module.exports = router;
