const Message = require('../models/Message');

//get direct message history
exports.getDMHistory = async (req, res) => {
    const message = await Message.find({
        $or: [
            { sender: req.user.id, receiver: req.params.userId},
            { sender: req.params.userId, receiver: req.user.id }
        ]
    }).sort('timestamp');
    res.json(messages);
};

//get room history
exports.getRoomHistory = async (req, res) => {
    const messages = await Message.find({ roomId: req.params.roomId }).sort('timestamp');
    res.json(messages);
};