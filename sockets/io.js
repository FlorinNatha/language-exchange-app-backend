// Simple holder for Socket.IO instance so controllers can emit events
module.exports = {
  io: null,
  setIo(i) { this.io = i; },
};
