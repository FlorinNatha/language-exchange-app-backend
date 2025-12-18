const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const { getDMHistory, getRoomHistory, deleteMessage, markAsRead } = require('../controllers/messageController');

router.get('/dm/:userId', protect, getDMHistory);
router.get('/room/:roomId', protect, getRoomHistory);
router.delete('/:id', protect, deleteMessage);
router.post('/:id/read', protect, markAsRead);

module.exports = router;
