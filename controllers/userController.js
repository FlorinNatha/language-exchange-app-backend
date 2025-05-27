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
  
}
