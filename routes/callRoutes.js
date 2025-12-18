const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCallsForRoom, getCallById } = require('../controllers/callController');

router.get('/room/:roomId', protect, getCallsForRoom);
router.get('/:id', protect, getCallById);

module.exports = router;
