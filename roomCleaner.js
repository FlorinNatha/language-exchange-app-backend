const Room = require('./models/Room');

const cleanEmptyRooms = async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    const deleted = await Room.deleteMany({
      users: { $size: 0 },
      lastActive: { $lt: fiveMinutesAgo },
    });

    if (deleted.deletedCount > 0) {
      console.log(`🧹 Deleted ${deleted.deletedCount} inactive rooms`);
    }

  } catch (err) {
    console.error('❌ Error cleaning rooms:', err.message);
  }
};

module.exports = () => {
  setInterval(cleanEmptyRooms, 60 * 1000); // Run every 1 minute
};
