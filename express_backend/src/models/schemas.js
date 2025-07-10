const mongoose = require('mongoose');

// Review Schema
const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    subcategory: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    brand: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    gender: {
        type: String,
        required: true,
        enum: ['men', 'women', 'unisex'],
        index: true
    },
    season: {
        type: String,
        required: true,
        enum: ['spring', 'summer', 'fall', 'winter', 'all-season'],
        index: true
    },
    color: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    stocks: {
        type: Number,
        required: true,
        min: 0
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    features: [{
        type: String,
        trim: true
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

productSchema.index({
    name: 'text',
    title: 'text',
    description: 'text',
    category: 'text',
    subcategory: 'text',
    brand: 'text',
    tags: 'text',
    features: 'text'
});

const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = { Product, Review };
