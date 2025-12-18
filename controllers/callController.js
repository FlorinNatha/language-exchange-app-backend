const Call = require('../models/Call');

exports.getCallsForRoom = async (req, res) => {
  try {
    const calls = await Call.find({ room: req.params.roomId }).sort('-createdAt');
    res.json(calls);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ msg: 'Call not found' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
