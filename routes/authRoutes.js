const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

router.post('forgot-password', forgotPassword);

router.post('reset-password/:token', resetPassword);

module.exports = router;
