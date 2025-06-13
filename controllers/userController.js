const User = require('../models/User');

// 1. Get All Users (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({msg: err.message});
  }
};

//2. Get User Profile
exports.getUserProfile = async (req, res) => {
  try{
    const user = await User.findById(req.params.id).select('-password');
    if(!user) return res.status(404).json({msg: 'User not found'});

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message});
  }
}

//3. Update User Profile
exports.updateUserProfile = async (req, res) => {
  if(req.user._id.toString() !== req.params.id)
    return res.status(403).json({msg: 'Not authorized to update this  profile'})

  const { username, language, bio } = req.body;

  try{
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({msg:'User not found'})

    user.username = username || user.username;
    user.language = language || user.language;
    user.bio = bio || user.bio;

    const updateUser = await user.save();
    res.json({msg: 'Profile updated', user: updateUser});
  } catch(err) {
    res.status(500).json({msg: err.message});
  }
}

//4. Get Online Users
let onlineUsers = new Set();

exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $in: [...onlineUsers]}}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({msg: err.message});
  }
};

//Helpers for Socket.IO
exports.addOnlineUser = (userID) => onlineUsers.add(userID);
exports.removeOnlineUser = (userId) => onlineUsers.delete(userId);


//follow another user
exports.followUser = async (req, res) => {
  try{
    const currentUser = await User.findById(req.user.id);
    const targetId = req.params.id;
    if(!currentUser.following.includes(targetId)) {
      currentUser.following.push(targetId);
      await currentUser.save();
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

//unfollow a user
exports.unfollowUser = async (req, res) => {
  try{
    const currentUser = await User.findById(req.user.id);
    const targetId = req.params.id;

    currentUser.following = currentUser.following.filter(
      (followedId) => followedId.toString() !== targetId
    );
    
    await currentUser.save();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Get list of followed users
exports.getFollowing = async (req, res) => {
  try{
    const user = await User.findById(req.user.id)
      .populate('following', 'username email')
      .select('following');
    res.json(user.following);
  }catch (err) {
    res.status(500).json({ message: err.message});
  }
};