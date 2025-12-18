const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: ''},
  bio: { type: String, default: ''},
  avatarUrl: { type: String, default: '' },
  followersCount: { type: Number, default: 0 },
  following:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  resetPasswordToken: String,
  resetPasswordExpires: Date

});

module.exports = mongoose.model('User', userSchema);
