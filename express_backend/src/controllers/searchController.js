const improvedNlpService = require('../services/improvedNlpService');
const searchService = require('../services/searchService');

class SearchController {
    async search(req, res) {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const filters = improvedNlpService.parseQueryWithNLP(query);

            const products = await searchService.searchProducts(query, filters);

            if (!products.products || products.products.length === 0) {
                console.error(' No results found! Search methods used:', products.searchMethods || 'none');
            }

            const frontendFilters = {
                priceRange: {},
                category: filters.category || null,
                subcategory: filters.subcategory || null,
                brand: filters.brand || null,
                color: filters.color || null,
                gender: filters.gender || null
            };

            if (filters.price_min !== undefined && filters.price_min > 0) {
                frontendFilters.priceRange.min = filters.price_min;
            }
            if (filters.price_max !== undefined && filters.price_max > 0) {
                frontendFilters.priceRange.max = filters.price_max;
            }

            const response = {
                ...products,
                extractedFilters: frontendFilters,
                nlpAnalysis: {
                    category: filters.category,
                    subcategory: filters.subcategory,
                    intent: filters.intent,
                    confidence: filters.nlp_analysis?.confidence,
                    priceDetected: !!(filters.price_min || filters.price_max)
                }
            };

            return res.json(response);

        } catch (error) {
            console.error(' Search controller error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new SearchController();