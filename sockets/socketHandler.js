const jwt = require('jsonwebtoken');
const { addOnlineUser, removeOnlineUser } = require("../controllers/userController");
const Message = require("../models/Message");
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const Call = require('../models/Call');

module.exports = (io) => {
  const userSocketMap = new Map(); //track online users

  io.on('connection', (socket) => {
    // Authenticate socket (if token provided) or fallback to query userId
    let userId = null;
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      }
    } catch (err) {
      console.error('Socket auth error:', err.message);
    }

    // fallback (existing behavior)
    if (!userId) userId = socket.handshake.query?.userId;

    if (userId) {
      addOnlineUser(userId);
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected`);
      io.emit('user-online', userId); //notify all users
    }

    //Join Room (enforce maxPeople)
    socket.on('join-room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { msg: 'Room not found' });

        // check kicked
        if (room.kickedUsers && room.kickedUsers.map(String).includes(userId)) {
          return socket.emit('kicked', { roomId });
        }

        // private room check
        if (room.isPrivate && !room.inviteList.map(String).includes(userId) && room.host.toString() !== userId.toString()) {
          return socket.emit('room-private', { roomId });
        }

        // enforce max people if set (>0)
        if (room.maxPeople && room.users.length >= room.maxPeople) {
          return socket.emit('room-full', { roomId });
        }

        // cancel scheduled deletion if host had left and someone joins
        if (room.scheduledDeletionAt) {
          room.scheduledDeletionAt = undefined;
          await room.save();
        }

        // add user
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { users: userId },
          lastActive: Date.now(),
          $pull: { inviteList: userId }
        });

        socket.join(roomId);
        socket.to(roomId).emit('user-joined', userId); //notify room
      } catch (err) {
        console.error('Error joining room:', err.message);
      }
    });

    //Leave Room
    socket.on('leave-room', async ({ roomId }) => {
      socket.leave(roomId);
      try {
        const room = await Room.findById(roomId);
        await Room.findByIdAndUpdate(roomId, {
          $pull: { users: userId },
          lastActive: Date.now(),
        });

        // if leaving user is the host, schedule deletion in 5 minutes
        if (room && room.host && room.host.toString() === userId.toString()) {
          const deletionAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
          await Room.findByIdAndUpdate(roomId, { scheduledDeletionAt: deletionAt });
          io.to(roomId).emit('host-left', { roomId, scheduledDeletionAt: deletionAt });
        } else {
          socket.to(roomId).emit('user-left', userId); //notify room
        }
      } catch (err) {
        console.error('Error leaving room:', err.message);
      }
    });

    //Raise hand/ request to speak
    socket.on('raise-hand', ({ roomId }) => {
      socket.to(roomId).emit('hand-raised', {userId});
    })

    //WebRTC Signaling Events
    socket.on('signal', ({to, from, data}) => {
      io.to(to).emit('signal', {from, data});
    });

    //Mic Status
    socket.on('mic-status', ({roomId, userId, isMicOn }) => {
      socket.to(roomId).emit('mic-status-changed', {userId, isMicOn });
    });

    // Typing indicators
    socket.on('typing:start', ({ to, roomId }) => {
      if (to) {
        const toSocket = userSocketMap.get(to);
        if (toSocket) io.to(toSocket).emit('typing:start', { from: userId });
      } else if (roomId) {
        socket.to(roomId).emit('typing:start', { from: userId });
      }
    });

    socket.on('typing:stop', ({ to, roomId }) => {
      if (to) {
        const toSocket = userSocketMap.get(to);
        if (toSocket) io.to(toSocket).emit('typing:stop', { from: userId });
      } else if (roomId) {
        socket.to(roomId).emit('typing:stop', { from: userId });
      }
    });

    //Private Message
    socket.on('private-message', async ({ to, content }) => {
      const message = new Message({ sender: userId, receiver: to, content });
      await message.save();

      const receiverSocketId = userSocketMap.get(to);

      // create persistent notification
      try {
        await Notification.create({
          user: to,
          type: 'message',
          data: { from: userId, messageId: message._id, preview: content }
        });
      } catch (err) {
        console.error('Error creating notification:', err.message);
      }

      if (receiverSocketId) {
        // mark delivered
        message.delivered = true;
        await message.save();

        io.to(receiverSocketId).emit('private-message', {
          from: userId,
          content,
          timestamp: message.timestamp,
          messageId: message._id
        });

        // real-time notification for recipient socket
        io.to(receiverSocketId).emit('new-notification', {
          type: 'message',
          from: userId,
          preview: content,
          messageId: message._id
        });
      }
    });

    // Call lifecycle (room-based)
    socket.on('call-invite', async ({ roomId, type = 'voice' }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { msg: 'Room not found' });

        const call = await Call.create({ room: roomId, initiator: userId, participants: [userId], type, status: 'ringing' });

        // notify all room participants of incoming call
        io.to(roomId).emit('call-invite', { callId: call._id, initiator: userId, type });
      } catch (err) {
        console.error('call-invite error:', err.message);
      }
    });

    socket.on('call-accept', async ({ callId }) => {
      try {
        const call = await Call.findById(callId);
        if (!call) return socket.emit('error', { msg: 'Call not found' });

        if (!call.participants.map(String).includes(userId.toString())) call.participants.push(userId);
        call.status = 'ongoing';
        call.startedAt = call.startedAt || Date.now();
        await call.save();

        io.to(call.room.toString()).emit('call-start', { callId: call._id, participants: call.participants });
      } catch (err) {
        console.error('call-accept error:', err.message);
      }
    });

    socket.on('call-decline', async ({ callId }) => {
      try {
        const call = await Call.findById(callId);
        if (!call) return socket.emit('error', { msg: 'Call not found' });
        // mark declined for this user (we keep status)
        io.to(call.room.toString()).emit('call-decline', { callId, from: userId });
      } catch (err) {
        console.error('call-decline error:', err.message);
      }
    });

    socket.on('call-join', async ({ callId }) => {
      try {
        const call = await Call.findById(callId);
        if (!call) return socket.emit('error', { msg: 'Call not found' });
        if (!call.participants.map(String).includes(userId.toString())) {
          call.participants.push(userId);
          await call.save();
        }
        socket.join(`call:${callId}`);
        io.to(`call:${callId}`).emit('participant-joined', { callId, userId });
      } catch (err) {
        console.error('call-join error:', err.message);
      }
    });

    socket.on('call-leave', async ({ callId }) => {
      try {
        const call = await Call.findById(callId);
        if (!call) return socket.emit('error', { msg: 'Call not found' });
        call.participants = call.participants.filter(p => p.toString() !== userId.toString());
        await call.save();
        socket.leave(`call:${callId}`);
        io.to(`call:${callId}`).emit('participant-left', { callId, userId });
      } catch (err) {
        console.error('call-leave error:', err.message);
      }
    });

    socket.on('call-end', async ({ callId }) => {
      try {
        const call = await Call.findById(callId);
        if (!call) return socket.emit('error', { msg: 'Call not found' });
        call.status = 'ended';
        call.endedAt = Date.now();
        await call.save();
        io.to(call.room.toString()).emit('call-ended', { callId });
      } catch (err) {
        console.error('call-end error:', err.message);
      }
    });

    //Room message
    socket.on('room-message', async ({ roomId, content }) => {
      const message = new Message({ sender: userId, roomId, content });
      await message.save();

      io.to(roomId).emit('room-message', {
        from: userId,
        content,
        roomId,
        timestamp: message.timestamp
      });
    });

    // message delivered ack from recipient
    socket.on('message-delivered', async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        msg.delivered = true;
        await msg.save();

        const senderId = msg.sender.toString();
        const senderSocketId = userSocketMap.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-delivered', { messageId, by: userId });
        }
      } catch (err) {
        console.error('message-delivered error:', err.message);
      }
    });

    // message-seen: batch mark messages as seen by this user
    socket.on('message-seen', async ({ messageIds = [], roomId, to }) => {
      try {
        if (!Array.isArray(messageIds) || messageIds.length === 0) return;

        await Message.updateMany({ _id: { $in: messageIds } }, { $addToSet: { seenBy: userId } });

        // notify original senders
        const msgs = await Message.find({ _id: { $in: messageIds } }).select('sender');
        const senderIds = [...new Set(msgs.map(m => m.sender.toString()))];
        for (const sid of senderIds) {
          const sidSocket = userSocketMap.get(sid);
          if (sidSocket) {
            io.to(sidSocket).emit('message-seen', { messageIds, seenBy: userId });
          }
        }
      } catch (err) {
        console.error('message-seen error:', err.message);
      }
    });

    //disconnect
    socket.on('disconnect', async () => {
      if (userId) {
        removeOnlineUser(userId);
        userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected`);
        io.emit('user-offline', userId);
        
        // Optionally mark all rooms as inactive if user was last
        try {
          await Room.updateMany(
            { users: userId },
            {
              $pull: { users: userId },
              lastActive: Date.now(),
            }
          );
        } catch (err) {
          console.error('Error updating rooms on disconnect:', err.message);
        }
      }
    });
  });
};
