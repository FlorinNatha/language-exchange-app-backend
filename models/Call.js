const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['voice', 'video'], default: 'voice' },
  status: { type: String, enum: ['ringing','ongoing','ended','cancelled','declined'], default: 'ringing' },
  startedAt: Date,
  endedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Call', callSchema);
