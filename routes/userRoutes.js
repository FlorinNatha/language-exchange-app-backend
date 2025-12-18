const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getAllUsers, getUserProfile, updateUserProfile, getOnlineUsers, followUser, unfollowUser, getFollowing, uploadAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, unique + '-' + file.originalname.replace(/\s+/g, '-'));
	}
});

const upload = multer({ storage });

router.get('/', protect, getAllUsers);
router.get('/online', protect, getOnlineUsers);
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.get('/following', protect, getFollowing);

// Avatar upload
router.post('/:id/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
