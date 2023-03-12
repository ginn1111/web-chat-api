const mongoose = require('mongoose');
const TokenSchema = new mongoose.Schema(
  {
    userId: { type: String },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Token', TokenSchema);
