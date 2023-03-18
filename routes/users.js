const { verifyToken, verifyTokenAndAuthorization } = require('./verify');

const router = require('express').Router();
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const { getURLAvatar, getURLCoverPicture } = require('../services/firebase');

// [GET 1 USER]
router.get('/find/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const { password, updatedAt, ...others } = user._doc;
    res.status(200).json(others);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [GET USERS WITH NAME]
router.get('/search', verifyToken, async (req, res) => {
  const name = req.body.name?.trim();
  const userId = req.user.id;
  const { offset = 0, limit = 10 } = req.query;
  try {
    const users = await User.find({
      $and: {
        $ne: userId,
        $or: [
          { nickname: { $regex: name, $options: 'gi' } },
          { firstName: { $regex: name, $options: 'gi' } },
          { lastName: { $regex: name, $options: 'gi' } },
        ],
      },
    })
      .skip(offset)
      .limit(limit);

    const response = userList.map((user) => {
      return {
        nickname: user.nickname,
        id: user._id,
        avatar: user.avatar,
        biography: user.biography,
      };
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [GET ALL USERS]
router.get('/', verifyToken, async (req, res) => {
  const qName = req.query.name;
  const offset = req.query?.offset ?? 0;
  const limit = req.query?.limit ?? 10;
  try {
    let responseUsers = [];
    // Check if request name query exists
    if (qName) {
      // Get users from db by firstName or lastName,
      // using Regex: 'gi' option use global and case-insensitive search
      // (finding all relevant result even upper case or lower case characters
      const users = await User.find({
        $or: [
          { nickname: { $regex: qName, $options: 'gi' } },
          { firstName: { $regex: qName, $options: 'gi' } },
          { lastName: { $regex: qName, $options: 'gi' } },
        ],
      })
        .skip(offset)
        .limit(limit);
      // Set users list get from db for the response data
      responseUsers = users.map((user) => {
        const { password, updatedAt, _id, __v, createAt, ...others } =
          user._doc;
        return { ...others, id: _id };
      });
    }
    // Send the result if qName exists,
    // otherwise the empty array by default;
    res.status(200).json(responseUsers);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [GET ALL FRIENDS OF USER]
router.get('/:id/friends', verifyToken, async (req, res) => {
  try {
    // Firstly, get own user
    const authUser = await User.findById(req.params.id);
    // After that, get all friends of this user by user id
    const friends = await Promise.all(
      authUser.friendList.map((friendId) => {
        // Return the relevant user with every id in friends list
        return User.findById(friendId);
      })
    );
    // Take all needed information
    const friendList = friends.map((friend) => {
      const { _id, firstName, lastName, avatar, coverPicture } = friend;
      return { _id, firstName, lastName, avatar, coverPicture };
    });
    res.status(200).json(friendList);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [UPDATE AVATAR]
router.put(`/:id/avatar`, verifyTokenAndAuthorization, async (req, res) => {
  const usrId = req.params.id;
  const avatarURL = await getURLAvatar(usrId);
  try {
    await User.findByIdAndUpdate(
      usrId,
      {
        $set: { avatar: avatarURL },
      },
      { new: true }
    );
    res.status(200).json(avatarURL);
  } catch (error) {
    res.status(500).json(error);
  }
});

// [UPDATE COVER PICTURE]
router.put(
  `/:id/cover-picture`,
  verifyTokenAndAuthorization,
  async (req, res) => {
    const usrId = req.params.id;
    const coverPictureURL = await getURLCoverPicture(usrId);
    try {
      await User.findByIdAndUpdate(
        usrId,
        {
          $set: { coverPicture: coverPictureURL },
        },
        { new: true }
      );
      res.status(200).json(coverPictureURL);
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

// [UPDATE USER]
router.put('/:id/edit', verifyTokenAndAuthorization, async (req, res) => {
  // Take the password and hash it if the user changes
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SECURE
    ).toString();
  }
  try {
    // User change password
    if (req.body.password) {
      const currentUser = await User.findById(req.params.id);

      // Decrypt password from db (1)
      const hashedPassword = CryptoJS.AES.decrypt(
        currentUser.password,
        process.env.PASS_SECURE
      );
      // Turn (1) to blank text password
      const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
      // Check if the confirm password is correct
      if (req.body.currentPassword !== originalPassword) {
        return res.status(401).json('Authenticated failed!');
      }
    }
    // Set all request information in the body for the updated user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    const { password, updatedAt, ...others } = updatedUser._doc;
    res.status(200).json({
      ...others,
      accessToken: req.headers['x-authorization'].split(' ')[1],
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// [SEND ADD FRIEND REQUEST]
router.put(
  '/:id/friends/add',
  verifyTokenAndAuthorization,
  async (req, res) => {
    // Take friend id who the auth user sends
    const qReceiverId = req.query.receiverId;
    // If receiver id is not auth user id, add to friends list
    if (qReceiverId !== req.params.id) {
      try {
        // Take auth user from db process (1)
        const getSenderProcess = User.findById(req.params.id);
        // Take receiver from db process (2)
        const getReceiverProcess = User.findById(qReceiverId);

        // Take response data from process (1)
        const sender = await getSenderProcess;
        // Take response data from process (2)
        const receiver = await getReceiverProcess;

        // Check if the receiver id is already auth user's friend
        if (
          sender.friendRequest.includes(qReceiverId) ||
          sender.friendResponse.includes(qReceiverId) ||
          sender.friendList.includes(qReceiverId)
        ) {
          // If both are already friends, send error
          return res.status(400).json('Requested failed!');
        }
        // If not, add receiver id to friendRequest of auth user
        const updateSenderProcess = sender.updateOne({
          $push: { friendRequest: qReceiverId },
        });
        // and add auth user's id to friendResponse of receiver
        const updateReceiverProcess = receiver.updateOne({
          $push: { friendResponse: req.params.id },
        });
        await updateSenderProcess;
        await updateReceiverProcess;
        res.status(200).json('Request sent successfully!');
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      // otherwise, send error
      return res.status(403).json('You cannot add yourself to friend list!');
    }
  }
);

// [RESPONSE TO ADD FRIEND REQUEST]
router.put(
  '/:id/friends/response',
  verifyTokenAndAuthorization,
  async (req, res) => {
    // Take receiver id and response (accepted = 'true'/'false')
    const qReceiverId = req.query.receiverId;
    const qIsAccepted = req.query.accepted;
    // If receiver id is not auth user's id,
    // start response processing
    if (qReceiverId !== req.params.id) {
      try {
        // Take auth user from db process (1)
        const getSenderProcess = User.findById(req.params.id);
        // Take receiver from db process (2)
        const getReceiverProcess = User.findById(qReceiverId);

        // Take auth user from process (1)
        const sender = await getSenderProcess;
        // Take receiver from process (2)
        const receiver = await getReceiverProcess;

        switch (qIsAccepted) {
          // In the case add friend request is accepted
          case 'true': {
            // Delete receiver id from friendResponse
            // and add it to friendList of the auth user
            const updateSenderProcess = sender.updateOne({
              $pull: { friendResponse: qReceiverId },
              $push: { friendList: qReceiverId },
            });
            // Delete auth user's id from friendRequest
            // and add it to friendList of the receiver
            const updateReceiverProcess = receiver.updateOne({
              $pull: { friendRequest: req.params.id },
              $push: { friendList: req.params.id },
            });
            await updateSenderProcess;
            await updateReceiverProcess;
            res.status(202).json(receiver);
            break;
          }
          // In the case add friend request is denied
          case 'false': {
            // Delete receiver id from friendResponse of auth user
            const updateSenderProcess = sender.updateOne({
              $pull: { friendResponse: qReceiverId },
            });
            // Delete auth user's id from friendRequest of receiver
            const updateReceiverProcess = receiver.updateOne({
              $pull: { friendRequest: req.params.id },
            });
            await updateSenderProcess;
            await updateReceiverProcess;
            res.status(200).json('Request denied');
            break;
          }
          default:
            res.status(400).json('Bad Request!');
            break;
        }
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      // Else send error
      return res.status(403).json('You cannot do add or remove yourself!');
    }
  }
);

// [UNFRIEND]
router.put(
  '/:id/friends/unfriend',
  verifyTokenAndAuthorization,
  async (req, res) => {
    // Take receiver id from request
    const qReceiverId = req.query.receiverId;
    // If receiver id is not auth user's id,
    // start response processing
    if (qReceiverId !== req.params.id) {
      try {
        // Take auth user from db process (1)
        const getSenderProcess = User.findById(req.params.id);
        // Take receiver from db process (2)
        const getReceiverProcess = User.findById(qReceiverId);

        // Take auth user from process (1)
        const sender = await getSenderProcess;
        // Take receiver from process (2)
        const receiver = await getReceiverProcess;

        // If receiver is auth user's friend, start unfriending
        if (sender.friendList.includes(qReceiverId)) {
          // Delete receiver id from auth user's friends list
          const updateSenderProcess = sender.updateOne({
            $pull: { friendList: qReceiverId },
          });
          // Delete auth user's id from receiver's friends list
          const updateReceiverProcess = receiver.updateOne({
            $pull: { friendList: req.params.id },
          });

          await updateSenderProcess;
          await updateReceiverProcess;
          res.status(200).json('Unfriend successfully!');
        } else {
          return res.status(403).json('You are not friends to unfriend!');
        }
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      // Else send error
      return res.status(403).json('You cannot unfriend yourself!');
    }
  }
);

// [DELETE USER]
router.delete('/:id/delete', verifyTokenAndAuthorization, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json('Deleted successfully!');
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
