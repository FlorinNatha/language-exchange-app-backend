const express = require('express');
const {protect} = require('../middleware/authMiddleware');
const { createRoom, getRooms, filterRooms } = require('../controllers/roomController');


const router = express.Router();
const { joinRoom, leaveRoom, inviteUser, kickUser, setMute, transferHost, cancelScheduledDeletion } = require('../controllers/roomController');

router.post('/create', protect, createRoom);
router.get('/',protect, getRooms);
router.get('/filter', protect, filterRooms);

// Server-side moderation endpoints
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);
router.post('/:id/invite', protect, inviteUser);
router.post('/:id/kick', protect, kickUser);
router.post('/:id/mute', protect, setMute);
router.post('/:id/transfer-host', protect, transferHost);
router.post('/:id/cancel-deletion', protect, cancelScheduledDeletion);

module.exports = router;