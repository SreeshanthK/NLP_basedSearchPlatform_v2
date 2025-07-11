const express = require('express');
const router = express.Router();
const reviewAnalysisController = require('../controllers/reviewAnalysisController');

/**
 * @route POST /api/reviews/analyze
 * @desc Analyze reviews using NLP
 * @access Public
 */
router.post('/analyze', reviewAnalysisController.analyzeReviews.bind(reviewAnalysisController));

module.exports = router; 