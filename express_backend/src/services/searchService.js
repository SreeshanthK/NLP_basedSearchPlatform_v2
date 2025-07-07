const { getESClient, getMongoClient } = require('../config/database');
const { applyNLPScoring } = require('./scoringService');

class SearchService {
    async searchProducts(query, filters) {
        const esClient = getESClient();
        const mongoClient = getMongoClient();

        if (esClient) {
            try {
                const products = await this.searchWithElasticsearch(esClient, query, filters);
                if (products.length > 0) {
                    return applyNLPScoring(products, filters, query);
                }
            } catch (error) {
            }
        }

        if (mongoClient) {
            const products = await this.searchWithMongoDB(mongoClient, query, filters);
            return applyNLPScoring(products, filters, query);
        }

        throw new Error('No search backend configured');
    }

    async searchWithElasticsearch(esClient, query, filters) {
        const shouldClauses = [];
        const filterClauses = [];

        const multiMatch = {
            multi_match: {
                query: query,
                fields: ["title^3", "description^2", "category^2", "brand^2", "tags"],
                fuzziness: "AUTO",
                type: "best_fields"
            }
        };
        shouldClauses.push(multiMatch);

        for (const keyword of filters.keywords || []) {
            if (keyword.length > 2) {
                shouldClauses.push({
                    multi_match: {
                        query: keyword,
                        fields: ["title^3", "description", "category", "brand", "tags"],
                        fuzziness: "AUTO"
                    }
                });
            }
        }

        if (filters.semantic_analysis) {
            const semantic = filters.semantic_analysis;

            if (semantic.brand_confidence) {
                for (const [brand, confidence] of Object.entries(semantic.brand_confidence)) {
                    const boostValue = Math.min(confidence * 2.0, 5.0);
                    shouldClauses.push({
                        term: {
                            "brand.keyword": {
                                value: brand,
                                boost: boostValue
                            }
                        }
                    });
                }
            }

            if (semantic.color_confidence) {
                for (const [color, confidence] of Object.entries(semantic.color_confidence)) {
                    const boostValue = Math.min(confidence * 1.8, 4.0);
                    shouldClauses.push({
                        term: {
                            "color.keyword": {
                                value: color,
                                boost: boostValue
                            }
                        }
                    });
                }
            }

            if (semantic.category_confidence) {
                for (const [category, confidence] of Object.entries(semantic.category_confidence)) {
                    const boostValue = Math.min(confidence * 1.5, 3.0);
                    shouldClauses.push({
                        term: {
                            "category.keyword": {
                                value: category,
                                boost: boostValue
                            }
                        }
                    });
                }
            }

            if (semantic.noun_phrases) {
                for (const phrase of semantic.noun_phrases) {
                    if (phrase.length > 3) {
                        shouldClauses.push({
                            match_phrase: {
                                title: {
                                    query: phrase,
                                    boost: 1.3
                                }
                            }
                        });
                    }
                }
            }
        } else {
            if (filters.category) {
                shouldClauses.push({
                    term: {
                        "category.keyword": {
                            value: filters.category,
                            boost: 2.0
                        }
                    }
                });
            }

            if (filters.brand) {
                shouldClauses.push({
                    term: {
                        "brand.keyword": {
                            value: filters.brand,
                            boost: 2.0
                        }
                    }
                });
            }

            if (filters.color) {
                shouldClauses.push({
                    term: {
                        "color.keyword": {
                            value: filters.color,
                            boost: 1.5
                        }
                    }
                });
            }
        }

        if (filters.brand) {
            filterClauses.push({ term: { "brand.keyword": filters.brand } });
        }

        if (filters.color) {
            filterClauses.push({ term: { "color.keyword": filters.color } });
        }

        if (filters.category) {
            if (filters.category === 'footwear') {
                const footwearTerms = ['sneakers', 'shoes', 'boots', 'sandals', 'heels', 'flats', 'footwear', 'running shoes', 'athletic shoes'];
                filterClauses.push({
                    bool: {
                        should: footwearTerms.map(term => ({ 
                            wildcard: { "category.keyword": `*${term}*` }
                        })),
                        minimum_should_match: 1
                    }
                });
            } else if (filters.category === 'mobile phones') {
                const electronicsTerms = ['mobile phones', 'smartphones', 'phones', 'mobile', 'smartphone'];
                filterClauses.push({
                    bool: {
                        should: electronicsTerms.map(term => ({ 
                            wildcard: { "category.keyword": `*${term}*` }
                        })),
                        minimum_should_match: 1
                    }
                });
            } else if (filters.category === 'clothing') {
                const clothingTerms = ['clothing', 'shirts', 't-shirts', 'pants', 'jeans', 'dresses', 'jackets', 'apparel'];
                filterClauses.push({
                    bool: {
                        should: clothingTerms.map(term => ({ 
                            wildcard: { "category.keyword": `*${term}*` }
                        })),
                        minimum_should_match: 1
                    }
                });
            } else {
                filterClauses.push({ 
                    wildcard: { "category.keyword": `*${filters.category}*` }
                });
            }
        }

        if (filters.gender) {
            filterClauses.push({ term: { "gender.keyword": filters.gender } });
        }

        if (filters.price_max) {
            filterClauses.push({ range: { price: { lte: filters.price_max } } });
        }

        if (filters.price_min) {
            filterClauses.push({ range: { price: { gte: filters.price_min } } });
        }

        if (filters.rating_min) {
            filterClauses.push({ range: { rating: { gte: filters.rating_min } } });
        }

        let esQuery;
        if (filterClauses.length > 0) {
            esQuery = {
                query: {
                    bool: {
                        should: shouldClauses,
                        filter: filterClauses,
                        minimum_should_match: 1
                    }
                },
                sort: [
                    { "_score": { order: "desc" } },
                    { "rating": { order: "desc" } },
                    { "price": { order: "asc" } }
                ],
                size: 50
            };
        } else {
            esQuery = {
                query: {
                    bool: {
                        should: shouldClauses,
                        minimum_should_match: 1
                    }
                },
                sort: [
                    { "_score": { order: "desc" } },
                    { "rating": { order: "desc" } },
                    { "price": { order: "asc" } }
                ],
                size: 50
            };
        }

        let response = await esClient.search({
            index: 'ecommerce',
            body: esQuery
        });

        let products = [];
        
        let hits = response.body?.hits?.hits || response.hits?.hits || [];
        let total = response.body?.hits?.total?.value || response.hits?.total?.value || response.body?.hits?.total || response.hits?.total || 0;
        
        if (hits.length === 0) {
            const fallbackQuery = {
                query: {
                    bool: {
                        should: [
                            {
                                multi_match: {
                                    query: query,
                                    fields: ["title^3", "description^2", "category^2", "brand^2", "tags"],
                                    fuzziness: "AUTO",
                                    type: "best_fields"
                                }
                            }
                        ],
                        filter: []
                    }
                },
                sort: [
                    { "_score": { order: "desc" } },
                    { "rating": { order: "desc" } },
                    { "price": { order: "asc" } }
                ],
                size: 50
            };

            if (filters.brand) {
                fallbackQuery.query.bool.filter.push({
                    match: { brand: filters.brand }
                });
            }
            
            if (filters.category) {
                fallbackQuery.query.bool.filter.push({
                    match: { category: filters.category }
                });
            }
            
            if (filters.price_max) {
                fallbackQuery.query.bool.filter.push({
                    range: { price: { lte: filters.price_max } }
                });
            }
            
            if (filters.price_min) {
                fallbackQuery.query.bool.filter.push({
                    range: { price: { gte: filters.price_min } }
                });
            }

            response = await esClient.search({
                index: 'ecommerce',
                body: fallbackQuery
            });
            
            hits = response.body?.hits?.hits || response.hits?.hits || [];
            total = response.body?.hits?.total?.value || response.hits?.total?.value || response.body?.hits?.total || response.hits?.total || 0;
        }

        for (const hit of hits) {
            const product = hit._source;
            product._score = hit._score;
            products.push(product);
        }

        return products;
    }

    async searchWithMongoDB(mongoClient, query, filters) {
        const db = mongoClient.db('ecommerce');
        const collection = db.collection('products');

        const mongoQuery = { $and: [] };
        
        const shoeIndicators = ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'];
        const electronicsIndicators = ['phone', 'mobile', 'smartphone', 'tablet', 'laptop', 'electronic', 'device', 'gadget'];
        const clothingIndicators = ['shirt', 'pant', 'dress', 'jacket', 'clothing', 'apparel', 'wear'];
        
        const isShoeQuery = shoeIndicators.some(indicator => query.toLowerCase().includes(indicator));
        const isElectronicsQuery = electronicsIndicators.some(indicator => query.toLowerCase().includes(indicator));
        const isClothingQuery = clothingIndicators.some(indicator => query.toLowerCase().includes(indicator));
        
        if (isShoeQuery || filters.category === 'footwear') {
            const footwearCategories = ['sneakers', 'running shoes', 'basketball shoes', 'tennis shoes', 'athletic shoes',
                'casual shoes', 'formal shoes', 'dress shoes', 'boots', 'ankle boots', 'hiking boots',
                'sandals', 'flip flops', 'heels', 'high heels', 'flats', 'loafers', 'oxfords', 'shoes', 'footwear'];
            
            mongoQuery.$and.push({
                $or: [
                    ...footwearCategories.map(cat => ({ category: { $regex: cat, $options: 'i' } })),
                    { title: { $regex: 'shoes|sneaker|boot|sandal|heel|flat|footwear', $options: 'i' } },
                    { tags: { $in: [/shoes/i, /sneaker/i, /boot/i, /sandal/i, /heel/i, /flat/i, /footwear/i] } }
                ]
            });
        } 
        else if (isElectronicsQuery || filters.category === 'mobile phones') {
            const electronicsCategories = ['mobile phones', 'smartphones', 'tablets', 'laptops', 'headphones', 'smartwatches'];
            const electronicsKeywords = ['mobile', 'phone', 'smartphone', 'tablet', 'laptop', 'computer', 'electronic', 'headphone', 'earphone', 'watch'];
            
            mongoQuery.$and.push({
                $or: [
                    ...electronicsCategories.map(cat => ({ category: { $regex: cat, $options: 'i' } })),
                    ...electronicsKeywords.map(keyword => ({ title: { $regex: keyword, $options: 'i' } }))
                ]
            });
        }
        else if (filters.category && filters.category !== 'footwear') {
            mongoQuery.$and.push({
                $or: [
                    { category: { $regex: filters.category, $options: 'i' } },
                    { title: { $regex: filters.category, $options: 'i' } }
                ]
            });
        }

        if (filters.brand) {
            mongoQuery.$and.push({ brand: { $regex: filters.brand, $options: 'i' } });
        }

        if (filters.color) {
            mongoQuery.$and.push({ color: { $regex: filters.color, $options: 'i' } });
        }

        if (filters.gender) {
            mongoQuery.$and.push({ gender: { $regex: filters.gender, $options: 'i' } });
        }

        if (filters.price_max) {
            mongoQuery.$and.push({ price: { $lte: filters.price_max } });
        }

        if (filters.price_min) {
            mongoQuery.$and.push({ price: { $gte: filters.price_min } });
        }

        if (filters.rating_min) {
            mongoQuery.$and.push({ rating: { $gte: filters.rating_min } });
        }

        if (mongoQuery.$and.length === 0) {
            delete mongoQuery.$and;
            mongoQuery.$text = { $search: query };
        } else {
            mongoQuery.$and.push({ $text: { $search: query } });
        }

        const products = await collection.find(mongoQuery).toArray();

        return products;
    }
}

module.exports = new SearchService();
