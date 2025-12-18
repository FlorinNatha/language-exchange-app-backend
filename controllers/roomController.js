const Room = require('../models/Room');
const Notification = require('../models/Notification');
const ioHolder = require('../sockets/io');

// Create Room
exports.createRoom = async (req, res) => {
  const { name, language, topic, micRequired, maxPeople, level, isPrivate } = req.body;
  try {
    const room = await Room.create({
      name,
      language,
      topic,
      micRequired,
      maxPeople: maxPeople || 0,
      level: level || 'any',
      isPrivate: !!isPrivate,
      host: req.user ? req.user.id : undefined,
      users: req.user ? [req.user.id] : []
    });
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

// Server-side join (for REST clients)
exports.joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });

    // private room check
    if (room.isPrivate && !room.inviteList.map(String).includes(req.user.id) && room.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Room is private' });
    }

    if (room.maxPeople && room.users.length >= room.maxPeople) {
      return res.status(400).json({ msg: 'Room is full' });
    }

    if (room.kickedUsers.map(String).includes(req.user.id)) {
      return res.status(403).json({ msg: 'You are banned from this room' });
    }

    await Room.findByIdAndUpdate(req.params.id, { $addToSet: { users: req.user.id }, lastActive: Date.now(), $pull: { inviteList: req.user.id } });
    // emit to room that user joined (if io available)
    const io = ioHolder.io;
    if (io) io.to(req.params.id).emit('user-joined', req.user.id);

    res.json({ msg: 'Joined room' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Server-side leave
exports.leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });

    await Room.findByIdAndUpdate(req.params.id, { $pull: { users: req.user.id }, lastActive: Date.now() });

    // if leaving user is host, schedule deletion
    if (room.host && room.host.toString() === req.user.id) {
      const deletionAt = new Date(Date.now() + 5 * 60 * 1000);
      await Room.findByIdAndUpdate(req.params.id, { scheduledDeletionAt: deletionAt });
      const io = ioHolder.io;
      if (io) io.to(req.params.id).emit('host-left', { roomId: req.params.id, scheduledDeletionAt: deletionAt });
    } else {
      const io = ioHolder.io;
      if (io) io.to(req.params.id).emit('user-left', req.user.id);
    }

    res.json({ msg: 'Left room' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Invite user
exports.inviteUser = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    // only host can invite for now
    if (!room.host || room.host.toString() !== req.user.id) return res.status(403).json({ msg: 'Only host can invite' });

    const { userId } = req.body;
    await Room.findByIdAndUpdate(req.params.id, { $addToSet: { inviteList: userId } });

    // create notification
    try { await Notification.create({ user: userId, type: 'room-invite', data: { roomId: req.params.id, from: req.user.id } }); } catch (e) {}

    res.json({ msg: 'User invited' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Kick user
exports.kickUser = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    // only host can kick for now
    if (!room.host || room.host.toString() !== req.user.id) return res.status(403).json({ msg: 'Only host can kick' });

    const { userId } = req.body;
    await Room.findByIdAndUpdate(req.params.id, { $pull: { users: userId }, $addToSet: { kickedUsers: userId } });

    // emit to room that user was kicked
    const io = ioHolder.io;
    if (io) io.to(req.params.id).emit('user-kicked', { userId, roomId: req.params.id });

    // create notification for kicked user
    try { await Notification.create({ user: userId, type: 'room-kick', data: { roomId: req.params.id, from: req.user.id } }); } catch (e) {}

    res.json({ msg: 'User kicked' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Mute/unmute user
exports.setMute = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    // only host can mute for now
    if (!room.host || room.host.toString() !== req.user.id) return res.status(403).json({ msg: 'Only host can mute/unmute' });

    const { userId, mute } = req.body;
    if (mute) {
      await Room.findByIdAndUpdate(req.params.id, { $addToSet: { mutedUsers: userId } });
    } else {
      await Room.findByIdAndUpdate(req.params.id, { $pull: { mutedUsers: userId } });
    }

    const io = ioHolder.io;
    if (io) io.to(req.params.id).emit('user-muted', { userId, mute });

    res.json({ msg: `User ${mute ? 'muted' : 'unmuted'}` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Transfer host
exports.transferHost = async (req, res) => {
  try {
    const { newHostId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (!room.host || room.host.toString() !== req.user.id) return res.status(403).json({ msg: 'Only host can transfer host' });

    room.host = newHostId;
    room.scheduledDeletionAt = undefined;
    await room.save();

    const io = ioHolder.io;
    if (io) io.to(req.params.id).emit('host-changed', { newHostId });

    res.json({ msg: 'Host transferred' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Cancel scheduled deletion (if someone reclaims)
exports.cancelScheduledDeletion = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    // allow host or server admin (here: any member) to cancel
    if (!room.users.map(String).includes(req.user.id)) return res.status(403).json({ msg: 'Only members can cancel deletion' });

    room.scheduledDeletionAt = undefined;
    await room.save();

    const io = ioHolder.io;
    if (io) io.to(req.params.id).emit('deletion-cancelled', { roomId: req.params.id });

    res.json({ msg: 'Scheduled deletion cancelled' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
