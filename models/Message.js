const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type:mongoose.Schema.Types.ObjectId, ref: 'User'}, // for Direct message
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'}, //for group
    content: { type: String, required: true},
    timestamp: { type: Date, default: Date.now},
    delivered: { type: Boolean, default: false },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Message', messageSchema);