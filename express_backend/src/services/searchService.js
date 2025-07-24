const { getESClient, getMongoClient } = require('../config/database');
const { parseQueryWithNLP } = require('./improvedNlpService');
const vectorService = require('./vectorService');
const multiModalSearchService = require('./multiModalSearchService');

class SearchService {
    constructor() {
        this.searchCache = new Map();
        this.cacheTimeout = 300000;
    }

    async searchProducts(query, filters = {}, page = 1, limit = 20) {

        try {

            const nlpAnalysis = await parseQueryWithNLP(query);

            const searchResults = await multiModalSearchService.performMultiModalSearch(
                query,
                filters,
                nlpAnalysis,
                getESClient(),
                getMongoClient()
            );

            const enhancedResults = await this.enhanceWithVectorSimilarity(searchResults, query, nlpAnalysis);

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = enhancedResults.slice(startIndex, endIndex);

            return {
                products: paginatedResults,
                totalResults: enhancedResults.length,
                currentPage: page,
                totalPages: Math.ceil(enhancedResults.length / limit),
                hasMore: endIndex < enhancedResults.length,
                searchMetadata: {
                    query,
                    filters,
                    nlpAnalysis,
                    timestamp: new Date().toISOString(),
                    resultCount: enhancedResults.length
                }
            };
        } catch (error) {
            console.error('❌ SearchService error:', error);

            return {
                products: [],
                totalResults: 0,
                currentPage: page,
                totalPages: 0,
                hasMore: false,
                searchMetadata: {
                    query,
                    filters,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    resultCount: 0
                }
            };
        }
    }

    async enhanceWithVectorSimilarity(results, query, nlpAnalysis) {

        try {

            const vectorResults = await vectorService.searchSimilar(query, { limit: 100 });

            const enhancedResults = results.map(result => {
                const vectorMatch = vectorResults.find(v =>
                    v._id?.toString() === result._id?.toString() ||
                    v.id?.toString() === result.id?.toString()
                );

                return {
                    ...result,
                    vectorScore: vectorMatch?.similarity || 0,
                    hasVectorMatch: !!vectorMatch
                };
            });

            return enhancedResults;
        } catch (error) {
            console.error('Vector similarity enhancement failed:', error);
            return results;
        }
    }
}

module.exports = new SearchService();