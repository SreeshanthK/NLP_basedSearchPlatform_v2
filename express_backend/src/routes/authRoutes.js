const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getProfile,
    logout,
    verifyOTP,
    resendOTP,
    requestPasswordReset,
    resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.get('/profile', authenticateToken, getProfile);

module.exports = router;