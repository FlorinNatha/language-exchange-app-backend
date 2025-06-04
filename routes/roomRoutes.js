const express = require('express');
const {protect} = require('../middleware/authMiddleware');
const { createRoom, getRooms, filterRooms } = require('../controllers/roomController');


const router = express.Router();

router.post('/create', protect, createRoom);
router.get('/',protect, getRooms);
router.get('/filter', protect, filterRooms);

module.exports = router;