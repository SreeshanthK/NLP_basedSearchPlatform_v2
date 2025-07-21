const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticateToken, requireCustomerOrAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/search', authenticateToken, requireCustomerOrAdmin, searchController.search.bind(searchController));

router.post('/test-search', searchController.search.bind(searchController));

module.exports = router;