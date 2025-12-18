const Message = require('../models/Message');

// get direct message history
exports.getDMHistory = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        }).sort('timestamp');

        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// get room history
exports.getRoomHistory = async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId }).sort('timestamp');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// delete a message (author or room owner/mod)
exports.deleteMessage = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ msg: 'Message not found' });

        // allow sender to delete; additional checks (room owner/mod) can be added
        if (msg.sender.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this message' });
        }

        await msg.remove();
        res.json({ msg: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// mark message as read by current user
exports.markAsRead = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ msg: 'Message not found' });

        if (!msg.seenBy.map(String).includes(req.user.id)) {
            msg.seenBy.push(req.user.id);
            await msg.save();
        }

        res.json({ msg: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};