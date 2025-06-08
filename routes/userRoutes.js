const express = require('express');
const router = express.Router();
const { getAllUsers, getUserProfile, updateUserProfile, getOnlineUsers, followUser, unfollowUser, getFollowing } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/online', protect, getOnlineUsers);
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.get('/following', protect, getFollowing);

module.exports = router;
