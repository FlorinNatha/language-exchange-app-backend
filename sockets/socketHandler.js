const { addOnlineUser, removeOnlineUser } = require("../controllers/userController");

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId; // pass userId from frontend

    if(userId) {
      addOnlineUser(userId); // mark user as online
      console.log(`User ${userId} connect`);
    }

    socket.on('join-room', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', userId);
    });

    socket.on('disconnect', () => {
      if(userId) {
        removeOnlineUser(userId); // mark user as offline
        console.log(`User ${userId} disconnected`);
      }
    });
  });
};
