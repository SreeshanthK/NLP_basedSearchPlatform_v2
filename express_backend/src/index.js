const nlpService = require('./src/services/nlpService');
const fallbackService = require('./src/services/fallbackService');
const scoringService = require('./src/services/scoringService');
const searchService = require('./src/services/searchService');

const searchController = require('./src/controllers/searchController');
const testController = require('./src/controllers/testController');

const searchRoutes = require('./src/routes/searchRoutes');
const testRoutes = require('./src/routes/testRoutes');

const database = require('./src/config/database');
const nlp = require('./src/config/nlp');

const textUtils = require('./src/utils/textUtils');
const fuzzyMatch = require('./src/utils/fuzzyMatch');

module.exports = {
    services: {
        nlpService,
        fallbackService,
        scoringService,
        searchService
    },
    controllers: {
        searchController,
        testController
    },
    routes: {
        searchRoutes,
        testRoutes
    },
    config: {
        database,
        nlp
    },
    utils: {
        textUtils,
        fuzzyMatch
    }
};
