const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunity,
  listCommunities,
  getMyFeed,
  getCommunityFeed
} = require('../controllers/communityController');

router.post('/', protect, createCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.get('/:id', protect, getCommunity);
router.get('/', protect, listCommunities);
router.get('/:id/feed', protect, getCommunityFeed);
router.get('/my/feed', protect, getMyFeed);

module.exports = router;
