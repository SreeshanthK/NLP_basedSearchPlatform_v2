const natural = require('natural');
const similarity = require('string-similarity');
const { getESClient, getMongoClient } = require('../config/database');
const { parseQueryWithNLP } = require('./improvedNlpService');
const semanticService = require('./semanticService');
const scoringService = require('./scoringService');
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

            const semanticAnalysis = await semanticService.analyzeSemanticIntent(query, nlpAnalysis);

            const searchResults = await multiModalSearchService.performMultiModalSearch(
                query,
                filters,
                nlpAnalysis,
                getESClient(),
                getMongoClient()
            );

            const enhancedResults = await this.enhanceWithVectorSimilarity(searchResults, query, nlpAnalysis);

            const finalResults = await scoringService.scoreAndRankResults(
                enhancedResults,
                query,
                nlpAnalysis,
                semanticAnalysis,
                filters
            );

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = finalResults.slice(startIndex, endIndex);

            return {
                products: paginatedResults,
                totalResults: finalResults.length,
                currentPage: page,
                totalPages: Math.ceil(finalResults.length / limit),
                hasMore: endIndex < finalResults.length,
                searchMetadata: {
                    query,
                    filters,
                    nlpAnalysis,
                    semanticAnalysis,
                    timestamp: new Date().toISOString(),
                    resultCount: finalResults.length
                }
            };
        } catch (error) {
            console.error('❌ SearchService error:', error);

            return await this.performBasicFallback(query, filters, page, limit);
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

    async performBasicFallback(query, filters, page, limit) {

        try {
            const mongoClient = getMongoClient();
            if (!mongoClient) {
                throw new Error('MongoDB client not available');
            }

            const db = mongoClient.db('ecommerce');
            const collection = db.collection('products');

            let results = [];

            try {

                const textResults = await collection.find({
                    $text: { $search: query }
                }).limit(50).toArray();

                results = textResults;

                if (results.length < 20) {
                    const regexResults = await collection.find({
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { title: { $regex: query, $options: 'i' } },
                            { category: { $regex: query, $options: 'i' } },
                            { subcategory: { $regex: query, $options: 'i' } },
                            { brand: { $regex: query, $options: 'i' } }
                        ]
                    }).limit(50).toArray();

                    const existingIds = new Set(results.map(r => r._id.toString()));
                    const newResults = regexResults.filter(r => !existingIds.has(r._id.toString()));
                    results = [...results, ...newResults];
                }
            } catch (textError) {

                results = await collection.find({
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { title: { $regex: query, $options: 'i' } },
                        { category: { $regex: query, $options: 'i' } },
                        { subcategory: { $regex: query, $options: 'i' } },
                        { brand: { $regex: query, $options: 'i' } }
                    ]
                }).limit(100).toArray();
            }

            const scoredResults = results.map(product => ({
                ...product,
                finalScore: this.calculateBasicRelevance(product, query)
            }));

            scoredResults.sort((a, b) => b.finalScore - a.finalScore);

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = scoredResults.slice(startIndex, endIndex);

            return {
                products: paginatedResults,
                totalResults: scoredResults.length,
                currentPage: page,
                totalPages: Math.ceil(scoredResults.length / limit),
                hasMore: endIndex < scoredResults.length,
                searchMetadata: {
                    query,
                    filters,
                    fallbackMode: true,
                    timestamp: new Date().toISOString(),
                    resultCount: scoredResults.length
                }
            };
        } catch (error) {
            console.error('Even fallback search failed:', error);
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

    calculateBasicRelevance(product, query) {
        const queryLower = query.toLowerCase();
        const productText = [
            product.name || '',
            product.title || '',
            product.description || '',
            product.category || '',
            product.subcategory || '',
            product.brand || ''
        ].join(' ').toLowerCase();

        let score = 0;

        if (productText.includes(queryLower)) {
            score += 10;
        }

        const queryWords = queryLower.split(' ');
        queryWords.forEach(word => {
            if (word.length > 2 && productText.includes(word)) {
                score += 5;
            }
        });

        if ((product.name || '').toLowerCase().includes(queryLower)) score += 8;
        if ((product.title || '').toLowerCase().includes(queryLower)) score += 8;
        if ((product.category || '').toLowerCase().includes(queryLower)) score += 6;
        if ((product.subcategory || '').toLowerCase().includes(queryLower)) score += 6;
        if ((product.brand || '').toLowerCase().includes(queryLower)) score += 4;

        return score;
    }

    removeDuplicates(results) {
        const seen = new Set();
        return results.filter(result => {
            const id = result._id?.toString() || result.id?.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    async getSearchSuggestions(query, limit = 5) {
        try {
            const nlpAnalysis = await nlpService.parseQueryWithNLP(query);
            const suggestions = [
                ...nlpAnalysis.synonyms || [],
                ...nlpAnalysis.relatedTerms || [],
                ...nlpAnalysis.expandedTerms || []
            ];

            return suggestions.slice(0, limit);
        } catch (error) {
            console.error('Failed to get search suggestions:', error);
            return [];
        }
    }

    async getPopularQueries(limit = 10) {
        try {

            return [
                'smartphones',
                'laptops',
                'shoes',
                'clothing',
                'electronics',
                'books',
                'home decor',
                'kitchen appliances',
                'gaming',
                'fitness equipment'
            ].slice(0, limit);
        } catch (error) {
            console.error('Failed to get popular queries:', error);
            return [];
        }
    }
}

module.exports = new SearchService();