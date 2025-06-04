const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    language: String,
    topic: String,
    micRequired : Boolean,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    createdAt: {type: Date, default: Date.now},
    lastActive: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Room', roomSchema);