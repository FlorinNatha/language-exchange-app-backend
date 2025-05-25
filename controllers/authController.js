const User = require('../models/User');
const bcrypt =require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async(req, res) => {
  const { username, email, password } =  req.body;
  try{
    const userExists = await User.findOne({ email });
    if(userExists) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({username, email, password: hashedPassword});
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
    res.json({token, user: {id: newUser._id, username, email }});
  } catch (err) {
    res.status(500).json({msg: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const {email} = req.body;
  try{
    const user = await User.findOne({email});
    if(!user) return res.status(404).json({msg: 'No user with that email'});

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000 //1hour

    user.resetPasswordToken= token;
    user.resetPasswordExpires= expires;
    await user.save();

    const resetLink = 'http://localhost:3000/reset-password/${token}';
    await sendEmail(
      user.email,
      'Password Reset Request',
      'Click the lonk to reset your password: ${resetLink}'
    );

    res.json({msg: 'Reset link sent to email'});
  }catch (err) {
    res.json(500).json({msg: err.message});
  }
};

exports.resetPassword = async (req, res) => {
  const {token} = req.params;
  const {password} = req.body;

  try{
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now()}
    });

    if(!user) return res.status(400).json({msg: 'Invalid or expired token'});

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordExpires= undefined;
    user.resetPasswordToken= undefined;

    await user.save();

    res.json({msg: 'Password reset successful'});
  }catch(err){
    res.status(500).json({msg: err.message});
  }
};

