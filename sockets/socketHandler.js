const { addOnlineUser, removeOnlineUser } = require("../controllers/userController");
const Room = require('../models/Room');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId; // Pass userId from frontend

    if (userId) {
      addOnlineUser(userId);
      console.log(`User ${userId} connected`);
    }

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
