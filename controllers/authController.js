const User = require('../models/User');
const bcrypt =require('bcryptjs');
const jwt = require('jsonwebtoken');

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

