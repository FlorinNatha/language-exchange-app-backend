const Room = require('../models/Room');

// Create Room
exports.createRoom = async (req, res) => {
  const { name, language, topic, micRequired } = req.body;
  try {
    const room = await Room.create({ name, language, topic, micRequired });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// List Active Rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('users', 'username');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Filter Rooms
exports.filterRooms = async (req, res) => {
  const { language, topic, micRequired } = req.query;
  try {
    const query = {};
    if (language) query.language = language;
    if (topic) query.topic = topic;
    if (micRequired !== undefined) query.micRequired = micRequired === 'true';

    const rooms = await Room.find(query);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
