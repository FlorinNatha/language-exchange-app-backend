const Community = require('../models/Community');
const Post = require('../models/Post');

// Create community
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category, coverImage } = req.body;
    const community = await Community.create({
      name,
      description,
      category,
      coverImage,
      admins: req.user ? [req.user.id] : [],
      members: req.user ? [req.user.id] : []
    });
    res.status(201).json(community);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Join community
exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ msg: 'Community not found' });

    if (!community.members.map(String).includes(req.user.id)) {
      community.members.push(req.user.id);
      await community.save();
    }

    res.json({ msg: 'Joined community' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Leave community
exports.leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ msg: 'Community not found' });

    community.members = community.members.filter(m => m.toString() !== req.user.id);
    community.admins = community.admins.filter(a => a.toString() !== req.user.id);
    await community.save();

    res.json({ msg: 'Left community' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single community (with member count)
exports.getCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate('admins', 'username').lean();
    if (!community) return res.status(404).json({ msg: 'Community not found' });
    community.membersCount = community.members.length;
    res.json(community);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// List communities (with optional search)
exports.listCommunities = async (req, res) => {
  try {
    const q = req.query.q || '';
    const query = q ? { name: { $regex: q, $options: 'i' } } : {};
    const communities = await Community.find(query).limit(50).lean();
    const result = communities.map(c => ({ ...c, membersCount: c.members.length }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get user's feed: posts from communities the user is a member of
exports.getMyFeed = async (req, res) => {
  try {
    const user = req.user.id;
    const communities = await Community.find({ members: user }).select('_id');
    const communityIds = communities.map(c => c._id);
    const posts = await Post.find({ community: { $in: communityIds } })
      .sort('-createdAt')
      .limit(50)
      .populate('author', 'username avatarUrl')
      .populate('community', 'name coverImage');

    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get community feed (posts for a community)
exports.getCommunityFeed = async (req, res) => {
  try {
    const posts = await Post.find({ community: req.params.id })
      .sort('-createdAt')
      .limit(50)
      .populate('author', 'username avatarUrl');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
