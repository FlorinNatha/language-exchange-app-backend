const { addOnlineUser, removeOnlineUser } = require("../controllers/userController");
const Message = require("../models/Message");
const Room = require('../models/Room');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId; // Pass userId from frontend

    if (userId) {
      addOnlineUser(userId);
      console.log(`User ${userId} connected`);
    }

    //Join Room
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      try {
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { users: userId },
          lastActive: Date.now(),
        });
        socket.to(roomId).emit('user-joined', userId);
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
        socket.to(roomId).emit('user-left', userId);
      } catch (err) {
        console.error('Error leaving room:', err.message);
      }
    });

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

      const receiverSocket = [...io.sockets.sockets.values()].find(
        s => s.handshake.query.userId === to
      );
      if (receiverSocket) {
        receiverSocket.emit('private-message', {
          from: userId,
          content,
          timestamp: message.timestamp
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
        console.log(`User ${userId} disconnected`);
        
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
