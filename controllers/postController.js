const Post = require('../models/Post');
const Community = require('../models/Community');

// Create a post in a community
exports.createPost = async (req, res) => {
  try {
    const { communityId, content, images } = req.body;
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ msg: 'Community not found' });

    // ensure user is a member
    if (!community.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ msg: 'Join community to post' });
    }

    const post = await Post.create({ author: req.user.id, community: communityId, content, images: images || [] });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Like a post (toggle)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const userIndex = post.likes.map(String).indexOf(req.user.id);
    if (userIndex === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(userIndex, 1);
    }
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Comment on post
exports.commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const { text } = req.body;
    const comment = { author: req.user.id, text };
    post.comments.push(comment);
    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatarUrl');
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
