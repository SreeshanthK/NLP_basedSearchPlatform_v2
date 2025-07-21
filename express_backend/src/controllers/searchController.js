const improvedNlpService = require('../services/improvedNlpService');
const searchService = require('../services/searchService');

class SearchController {
    async search(req, res) {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const { getMongoClient, initializeConnections } = require('../config/database');
            let mongoClient = getMongoClient();

            if (!mongoClient) {
                await initializeConnections();
                mongoClient = getMongoClient();

                if (!mongoClient) {
                    console.error(' Failed to establish MongoDB connection!');
                    return res.status(500).json({
                        error: 'Database connection issue',
                        message: 'Could not connect to MongoDB'
                    });
                }
            }

            try {
                const db = mongoClient.db('ecommerce');
                const collection = db.collection('products');
                const count = await collection.countDocuments({});

                if (count === 0) {
                    console.error(' WARNING: Product collection is empty!');
                    return res.status(500).json({
                        error: 'No products available',
                        message: 'The product database appears to be empty'
                    });
                }
            } catch (dbError) {
                console.error(' Database access error:', dbError);
                return res.status(500).json({
                    error: 'Database access issue',
                    message: dbError.message
                });
            }

            const filters = improvedNlpService.parseQueryWithNLP(query);

            const products = await searchService.searchProducts(query, filters);

            if (!products.products || products.products.length === 0) {
                console.error(' No results found! Search methods used:', products.searchMethods || 'none');

                try {
                    const db = mongoClient.db('ecommerce');
                    const collection = db.collection('products');
                    const sampleProducts = await collection.find({}).limit(5).toArray();

                    sampleProducts.forEach((product, index) => {
                    });
                } catch (err) {
                    console.error('Failed to get sample products:', err);
                }
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