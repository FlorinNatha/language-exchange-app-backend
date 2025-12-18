const Room = require('./models/Room');
const Message = require('./models/Message');

const cleanEmptyRooms = async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    // Find all inactive, empty rooms OR rooms scheduled for deletion
    const roomsToDelete = await Room.find({
      $or: [
        { users: { $size: 0 }, lastActive: { $lt: fiveMinutesAgo } },
        { scheduledDeletionAt: { $lt: new Date() } }
      ]
    });

    const roomIds = roomsToDelete.map(room => room._id);

    if (roomIds.length > 0) {
      // Delete messages for those rooms
      await Message.deleteMany({ roomId: { $in: roomIds } });

      // Delete the rooms themselves
      const deleted = await Room.deleteMany({ _id: { $in: roomIds } });

      console.log(`🧹 Deleted ${deleted.deletedCount} inactive rooms and their messages`);
    }

  } catch (err) {
    console.error('❌ Error cleaning rooms:', err.message);
  }
};

module.exports = () => {
  setInterval(cleanEmptyRooms, 60 * 1000); // Run every 1 minute
};
