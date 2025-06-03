const express = require('express');
const router = express.Router();
const { getAllUsers, getUserProfile, updateUserProfile, getOnlineUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/online', protect, getOnlineUsers);
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);

module.exports = router;
