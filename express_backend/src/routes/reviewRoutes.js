const express = require('express');
const router = express.Router();
const reviewAnalysisController = require('../controllers/reviewAnalysisController');

router.post('/analyze', reviewAnalysisController.analyzeReviews.bind(reviewAnalysisController));

module.exports = router;