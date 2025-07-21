const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        let user;
        if (existingUser && !existingUser.isEmailVerified) {

            user = existingUser;
            user.name = name;
            user.password = password;
            user.emailVerificationOTP = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {

            user = new User({
                name,
                email,
                password,
                role: 'customer',
                emailVerificationOTP: otp,
                otpExpiry: otpExpiry,
                isEmailVerified: false
            });
            await user.save();
        }

        const emailSent = await emailService.sendOTP(email, otp, 'account verification');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for OTP verification.',
            userId: user._id
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first. Check your inbox for OTP.',
                requiresVerification: true,
                userId: user._id
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};

const verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and OTP'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        if (!user.isOTPValid(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        user.isEmailVerified = true;
        user.clearOTP();
        await user.save();

        await emailService.sendWelcomeEmail(user.email, user.name);

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.emailVerificationOTP = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const emailSent = await emailService.sendOTP(user.email, otp, 'account verification');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully! Check your email.'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {

            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset OTP has been sent.',
                email: email
            });
        }

        const otp = emailService.generateOTP();
        user.setPasswordResetOTP(otp);
        await user.save();

        const emailSent = await emailService.sendOTP(user.email, otp, 'password reset');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent successfully!',
            email: email
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isPasswordResetOTPValid(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        user.password = newPassword;
        user.clearOTP();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    logout,
    verifyOTP,
    resendOTP,
    requestPasswordReset,
    resetPassword
};