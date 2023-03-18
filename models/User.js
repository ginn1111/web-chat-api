const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    nickname: { type: String, required: true },
    gender: { type: String, default: 'female' }, // 'female' | 'male' | 'other'
    birthday: { type: Date, default: '' },
    biography: { type: String, default: 'Not updated yet...' },
    avatar: { type: String, default: '' },
    coverPicture: { type: String, default: '' },
    friendList: { type: Array, default: [] },
    friendRequest: { type: Array, default: [] },
    friendResponse: { type: Array, default: [] },
  },
  { timestamps: true }
);
module.exports = mongoose.model('User', UserSchema);
