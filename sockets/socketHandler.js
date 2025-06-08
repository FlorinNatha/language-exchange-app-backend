const { addOnlineUser, removeOnlineUser } = require("../controllers/userController");
const Message = require("../models/Message");
const Room = require('../models/Room');

module.exports = (io) => {
  const userSocketMap = new Map(); //track online users

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId; // Pass userId from frontend

    if (userId) {
      addOnlineUser(userId);
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected`);
      io.emit('user-online', userId); //notify all users
    }

    //Join Room
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      try {
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { users: userId },
          lastActive: Date.now(),
        });
        socket.to(roomId).emit('user-joined', userId); //notify room
      } catch (err) {
        console.error('Error joining room:', err.message);
      }
    });

    //Leave Room
    socket.on('leave-room', async ({ roomId }) => {
      socket.leave(roomId);
      try {
        await Room.findByIdAndUpdate(roomId, {
          $pull: { users: userId },
          lastActive: Date.now(),
        });
        socket.to(roomId).emit('user-left', userId); //notify room
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

    //Private Message
    socket.on('private-message', async ({ to, content }) => {
      const message = new Message({ sender: userId, receiver: to, content });
      await message.save();

      const receiverSocketId = userSocketMap.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private-message', {
          from: userId,
          content,
          timestamp: message.timestamp
        });

        //notification for new Direct message
        io.to(receiverSocketId).emit('new-dm-notification', {
          from: userId,
          preview: content
        });
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
