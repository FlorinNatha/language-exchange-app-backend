const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPost, toggleLike, commentPost, getPost } = require('../controllers/postController');

router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, commentPost);
router.get('/:id', protect, getPost);

module.exports = router;
