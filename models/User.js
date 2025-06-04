const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: ''},
  bio: { type: String, default: ''},
  resetPasswordToken: String,
  resetPasswordExpires: Date

});

module.exports = mongoose.model('User', userSchema);
