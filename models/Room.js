const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    language: String,
    topic: String,
    micRequired : Boolean,
    maxPeople: { type: Number, default: 0 },
    level: { type: String, default: 'any' },
    isPrivate: { type: Boolean, default: false },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    inviteList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    kickedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: {type: Date, default: Date.now},
    lastActive: {type: Date, default: Date.now},
    scheduledDeletionAt: Date,
});

module.exports = mongoose.model('Room', roomSchema);