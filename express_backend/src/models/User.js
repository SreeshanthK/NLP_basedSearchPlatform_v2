const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.clearOTP = function() {
    this.emailVerificationOTP = null;
    this.otpExpiry = null;
};

userSchema.methods.isOTPValid = function(otp) {
    return this.emailVerificationOTP === otp &&
           this.otpExpiry &&
           this.otpExpiry > new Date();
};

userSchema.methods.setPasswordResetOTP = function(otp) {
    this.emailVerificationOTP = otp;
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
};

userSchema.methods.isPasswordResetOTPValid = function(otp) {
    return this.emailVerificationOTP === otp &&
           this.otpExpiry &&
           this.otpExpiry > new Date();
};

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;