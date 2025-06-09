const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const { getDMHistory, getRoomHistory } = require('../controllers/messageController');

router.get('/dm/:userId', protect, getDMHistory);
router.get('/room/:roomId', protect, getRoomHistory);

module.exports = router;
