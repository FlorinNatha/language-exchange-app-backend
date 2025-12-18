const Notification = require('../models/Notification');

// Get notifications for current user (paginated)
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notif) return res.status(404).json({ msg: 'Notification not found' });
    notif.isRead = true;
    await notif.save();
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ msg: 'Notifications cleared' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
