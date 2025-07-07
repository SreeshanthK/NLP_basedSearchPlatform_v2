const express = require('express');
const testController = require('../controllers/testController');

const router = express.Router();

router.post('/test/add-sample-data', testController.addSampleData.bind(testController));
router.get('/debug/elasticsearch', testController.debugElasticsearch.bind(testController));

module.exports = router;
