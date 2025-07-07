const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.post('/search', searchController.search.bind(searchController));

module.exports = router;
