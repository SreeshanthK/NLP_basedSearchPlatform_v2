const { getESClient, getMongoClient, initializeConnections } = require('../config/database');
const { applyNLPScoring } = require('./scoringService');
const { analyzeSemanticIntent, buildSemanticQuery, applySemanticScoring } = require('./semanticService');
const { analyzeQueryWithNLP, calculateRelevanceScore } = require('../config/nlp');
const vectorService = require('./vectorService');
require('dotenv').config();
class SearchService {
    async searchProducts(query, filters) {
        console.log('🔍 SearchService.searchProducts called with query:', query);
        const semanticAnalysis = analyzeSemanticIntent(query);
        const semanticQuery = buildSemanticQuery(query, semanticAnalysis);
        console.log('🧠 Semantic Analysis:', {
            detectedIntents: semanticAnalysis.detectedIntents,
            categoryPriorities: semanticAnalysis.categoryPriorities,
            expandedTerms: semanticQuery.expandedTerms.slice(0, 5) 
        });
        let esClient = getESClient();
        let mongoClient = getMongoClient();
        if (!esClient && !mongoClient) {
            console.log('Initializing database connections...');
            await initializeConnections();
            esClient = getESClient();
            mongoClient = getMongoClient();
        }
        let allResults = [];
        let searchMethods = {
            vector: false,
            elasticsearch: false,
            mongodb: false
        };
        if (process.env.VECTOR_SEARCH_ENABLED === 'true') {
            try {
                console.log('Vector search is enabled, attempting vector search...');
                const searchQuery = semanticQuery.enhancedQuery || query;
                const vectorResults = await this.performVectorSearch(searchQuery, 120);
                console.log(`Vector search returned ${vectorResults.length} results`);
                if (vectorResults.length > 0) {
                    const relevantVectorResults = vectorResults.filter(result => 
                        result.similarity > 0.3 || result.vectorScore > 1.0
                    );
                    console.log(`Filtered to ${relevantVectorResults.length} relevant vector results`);
                    if (relevantVectorResults.length > 0) {
                        allResults = allResults.concat(relevantVectorResults);
                        searchMethods.vector = true;
                        console.log(`Vector search found ${relevantVectorResults.length} relevant results`);
                    }
                }
            } catch (error) {
                console.error('Vector search failed:', error);
            }
        } else {
            console.log('Vector search is disabled. VECTOR_SEARCH_ENABLED =', process.env.VECTOR_SEARCH_ENABLED);
        }
        if (esClient) {
            try {
                const products = await this.searchWithElasticsearch(esClient, query, filters, semanticAnalysis);
                if (products.length > 0) {
                    const elasticResults = products.map(product => ({
                        ...product,
                        searchType: 'elasticsearch',
                        elasticScore: product._score || 1
                    }));
                    allResults = allResults.concat(elasticResults);
                    searchMethods.elasticsearch = true;
                }
            } catch (error) {
                console.error('Elasticsearch search failed:', error);
            }
        }
        if (mongoClient) {
            try {
                const mongoResult = await this.searchWithMongoDB(mongoClient, query, filters, semanticAnalysis);
                if (mongoResult.products.length > 0) {
                    const mongoScore = semanticAnalysis.isColorSearch && mongoResult.wasCategorySearch ? 5.0 : 0.8;
                    const mongoResults = mongoResult.products.map(product => ({
                        ...product,
                        searchType: 'mongodb',
                        mongoScore: mongoScore,
                        wasCategorySearch: mongoResult.wasCategorySearch || false
                    }));
                    allResults = allResults.concat(mongoResults);
                    searchMethods.mongodb = true;
                    console.log(`MongoDB search found ${mongoResults.length} results with score ${mongoScore}`);
                }
            } catch (error) {
                console.error('MongoDB search failed:', error);
            }
        }
        if (allResults.length === 0) {
            console.log('No results found from any search method, trying fallback query...');
            if (mongoClient) {
                try {
                    const fallbackProducts = await this.getFallbackProducts(mongoClient, query);
                    if (fallbackProducts.length > 0) {
                        console.log(`Fallback: found ${fallbackProducts.length} products using broad search`);
                        return {
                            products: fallbackProducts.map(product => ({
                                ...product,
                                isFallbackResult: true,
                                searchType: 'fallback'
                            })),
                            searchMethods: { fallback: true },
                            totalResults: fallbackProducts.length,
                            isFallback: true
                        };
                    }
                } catch (error) {
                    console.error('Fallback search failed:', error);
                }
            }
            return {
                products: [],
                searchMethods: searchMethods,
                totalResults: 0
            };
        }
        const mergedResults = this.mergeSearchResults(allResults);
        let filteredResults = mergedResults;
        if (filters.price_min || filters.price_max) {
            console.log(`Applying hard price filters: min=${filters.price_min}, max=${filters.price_max}`);
            filteredResults = mergedResults.filter(product => {
                let passesFilter = true;
                if (filters.price_min && product.price < filters.price_min) {
                    passesFilter = false;
                }
                if (filters.price_max && product.price > filters.price_max) {
                    passesFilter = false;
                }
                return passesFilter;
            });
            console.log(`Hard price filter: ${mergedResults.length} → ${filteredResults.length} products`);
        }
        const scoredResults = applyNLPScoring(filteredResults, filters, query);
        const semanticallyScored = applySemanticScoring(scoredResults, semanticAnalysis);
        if (semanticAnalysis.isColorSearch) {
            const colorIntentMatches = semanticallyScored.filter(r => r.color_match && r.intent_match);
            const intentMatches = semanticallyScored.filter(r => r.intent_match && !r.color_match);
            const colorMatches = semanticallyScored.filter(r => r.color_match && !r.intent_match);
            const others = semanticallyScored.filter(r => !r.color_match && !r.intent_match);
            [colorIntentMatches, intentMatches, colorMatches, others].forEach(group => {
                group.sort((a, b) => {
                    const aScore = (a.semantic_score || a.nlp_score || 0);
                    const bScore = (b.semantic_score || b.nlp_score || 0);
                    return bScore - aScore;
                });
            });
            semanticallyScored.splice(0, semanticallyScored.length, 
                ...colorIntentMatches, ...intentMatches, ...colorMatches, ...others);
        }
        const isPriceFocused = filters.price_min || filters.price_max || 
                             query.toLowerCase().includes('under') || 
                             query.toLowerCase().includes('over') ||
                             query.toLowerCase().includes('above') ||
                             query.toLowerCase().includes('below') ||
                             query.toLowerCase().includes('budget') ||
                             query.toLowerCase().includes('price') ||
                             /\d+/.test(query); 
        if (isPriceFocused) {
            console.log('Price-focused query detected, sorting by price relevance');
            semanticallyScored.sort((a, b) => {
                if (filters.price_min) {
                    const aValidPrice = a.price >= filters.price_min;
                    const bValidPrice = b.price >= filters.price_min;
                    if (aValidPrice && !bValidPrice) return -1;
                    if (!aValidPrice && bValidPrice) return 1;
                    if (aValidPrice && bValidPrice) {
                        return a.price - b.price;
                    }
                }
                if (filters.price_max) {
                    const aValidPrice = a.price <= filters.price_max;
                    const bValidPrice = b.price <= filters.price_max;
                    if (aValidPrice && !bValidPrice) return -1;
                    if (!aValidPrice && bValidPrice) return 1;
                    if (aValidPrice && bValidPrice) {
                        return b.price - a.price;
                    }
                }
                const aScore = (a.semantic_score || a.nlp_score || 0) + (a.vectorScore || 0) * 2;
                const bScore = (b.semantic_score || b.nlp_score || 0) + (b.vectorScore || 0) * 2;
                return bScore - aScore;
            });
        } else {
            semanticallyScored.sort((a, b) => {
                const aColorIntent = a.color_match && a.intent_match;
                const bColorIntent = b.color_match && b.intent_match;
                if (aColorIntent && !bColorIntent) return -1;
                if (!aColorIntent && bColorIntent) return 1;
                if (a.intent_match && !b.intent_match) return -1;
                if (!a.intent_match && b.intent_match) return 1;
                if (semanticAnalysis.isColorSearch) {
                    if (a.color_match && !b.color_match) return -1;
                    if (!a.color_match && b.color_match) return 1;
                }
                const aScore = (a.semantic_score || a.nlp_score || 0) + (a.vectorScore || 0) * 0.5;
                const bScore = (b.semantic_score || b.nlp_score || 0) + (b.vectorScore || 0) * 0.5;
                return bScore - aScore;
            });
        }
        const nlpAnalysis = analyzeQueryWithNLP(query);
        semanticallyScored.forEach(result => {
            result.nlp_relevance_score = calculateRelevanceScore(result, nlpAnalysis, semanticAnalysis);
        });
        semanticallyScored.sort((a, b) => {
            const aScore = (a.semantic_score || 0) + (a.nlp_relevance_score || 0);
            const bScore = (b.semantic_score || 0) + (b.nlp_relevance_score || 0);
            return bScore - aScore;
        });
        let threshold = Math.max(10, semanticallyScored[0]?.semantic_score || 0, semanticallyScored[0]?.nlp_relevance_score || 0) * 0.25;
        const filteredSmart = semanticallyScored.filter((r, i) => {
            if (i < 5) return true;
            const score = (r.semantic_score || 0) + (r.nlp_relevance_score || 0);
            return score >= threshold;
        });
        const relevantResults = filteredSmart;
        console.log(`Filtered from ${semanticallyScored.length} to ${relevantResults.length} relevant results`);
        let finalResults = relevantResults;
        let isFallback = false;
        if (relevantResults.length === 0 && semanticallyScored.length > 0) {
            console.log('No results passed relevance filter, using fallback: top 15 highest-scored products');
            const fallbackResults = semanticallyScored
                .sort((a, b) => {
                    const aScore = (a.semantic_score || a.nlp_score || 0) + (a.vectorScore || 0) * 2 + (a.match_percentage || 0) * 10;
                    const bScore = (b.semantic_score || b.nlp_score || 0) + (b.vectorScore || 0) * 2 + (b.match_percentage || 0) * 10;
                    return bScore - aScore;
                })
                .slice(0, 15)
                .map(product => ({
                    ...product,
                    isFallbackResult: true
                }));
            finalResults = fallbackResults;
            isFallback = true;
            console.log(`Fallback: showing top ${finalResults.length} highest-scored products`);
        }
        return {
            products: finalResults,
            searchMethods: searchMethods,
            totalResults: finalResults.length,
            isFallback: isFallback
        };
    }
    async performVectorSearch(query, limit) {
        try {
            const vectorResults = await vectorService.searchSimilar(query, limit, 0.001);
            console.log(`Vector service returned ${vectorResults.length} results`);
            if (vectorResults.length === 0) return [];
            const mongoClient = getMongoClient();
            if (!mongoClient) {
                return vectorResults.map(result => ({
                    _id: result.productId,
                    name: result.metadata.name || result.metadata.title,
                    title: result.metadata.title,
                    category: result.metadata.category,
                    subcategory: result.metadata.subcategory,
                    brand: result.metadata.brand,
                    price: result.metadata.price,
                    averageRating: result.metadata.averageRating || result.metadata.rating,
                    totalReviews: result.metadata.totalReviews,
                    searchType: 'vector',
                    similarity: result.similarity,
                    vectorScore: Math.min(result.similarity * 3, 3)
                }));
            }
            const db = mongoClient.db('ecommerce');
            const collection = db.collection('products');
            const reviewCollection = db.collection('reviews');
            const productIds = vectorResults.map(r => {
                try {
                    const { ObjectId } = require('mongodb');
                    return new ObjectId(r.productId);
                } catch (e) {
                    return r.productId;
                }
            });
            console.log(`Looking for MongoDB products with IDs:`, productIds.slice(0, 3));
            console.log(`Sample vector IDs:`, vectorResults.slice(0, 3).map(r => r.productId));
            const products = await collection.find({ _id: { $in: productIds } }).toArray();
            console.log(`Found ${products.length} matching products in MongoDB`);
            if (products.length > 0) {
                console.log(`Found product IDs:`, products.slice(0, 3).map(p => p._id.toString()));
            }
            for (const product of products) {
                product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
            }
            return products.map(product => {
                const vectorResult = vectorResults.find(r => r.productId === product._id.toString());
                return {
                    ...product,
                    searchType: 'vector',
                    similarity: vectorResult ? vectorResult.similarity : 0,
                    vectorScore: vectorResult ? Math.min(vectorResult.similarity * 3, 3) : 0,
                    baseSimilarity: vectorResult ? vectorResult.baseSimilarity : 0,
                    keywordBonus: vectorResult ? vectorResult.keywordBonus : 0
                };
            }).sort((a, b) => b.vectorScore - a.vectorScore);
        } catch (error) {
            console.error('Vector search error:', error);
            return [];
        }
    }
    mergeSearchResults(allResults) {
        const resultMap = new Map();
        allResults.forEach(product => {
            const id = product._id?.toString() || product.id?.toString();
            if (resultMap.has(id)) {
                const existing = resultMap.get(id);
                existing.searchTypes = existing.searchTypes || [existing.searchType];
                if (!existing.searchTypes.includes(product.searchType)) {
                    existing.searchTypes.push(product.searchType);
                }
                const vectorBoost = product.vectorScore || 0;
                const elasticBoost = product.elasticScore || 0;
                const mongoBoost = product.mongoScore || 0;
                existing.combinedScore = Math.max(
                    existing.combinedScore || 0,
                    vectorBoost + elasticBoost + mongoBoost
                );
                if (product.similarity) existing.similarity = Math.max(existing.similarity || 0, product.similarity);
                if (product._score) existing._score = Math.max(existing._score || 0, product._score);
                if (vectorBoost > 0 && elasticBoost > 0) {
                    existing.combinedScore += 0.5;
                }
            } else {
                resultMap.set(id, {
                    ...product,
                    searchTypes: [product.searchType],
                    combinedScore: (product.vectorScore || 0) + (product.elasticScore || 0) + (product.mongoScore || 0)
                });
            }
        });
        return Array.from(resultMap.values())
            .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
            .slice(0, 60);
    }
    async searchWithElasticsearch(esClient, query, filters, semanticAnalysis = null) {
        try {
            const countResponse = await esClient.count({ index: 'products' });
            const docCount = countResponse.body?.count || countResponse.count || 0;
            if (docCount === 0) {
                console.log('Elasticsearch index is empty, skipping ES search');
                return [];
            }
        } catch (error) {
            console.log('Could not check Elasticsearch index, proceeding with search');
        }
        const shouldClauses = [];
        const filterClauses = [];
        const multiMatch = {
            multi_match: {
                query: query,
                fields: [
                    "name^3", 
                    "title^3", 
                    "description^2", 
                    "category^2", 
                    "subcategory^2.5", 
                    "brand^2", 
                    "tags^2", 
                    "features^1.5"
                ],
                fuzziness: "AUTO",
                type: "best_fields"
            }
        };
        shouldClauses.push(multiMatch);
        if (semanticAnalysis) {
            const { expandedTerms, categoryPriorities } = semanticAnalysis;
            expandedTerms.forEach(term => {
                if (term !== query.toLowerCase()) {
                    shouldClauses.push({
                        multi_match: {
                            query: term,
                            fields: [
                                "name^2", 
                                "title^2", 
                                "description^1.5", 
                                "category^2", 
                                "subcategory^2", 
                                "tags^1.5"
                            ],
                            fuzziness: "AUTO",
                            boost: 1.5
                        }
                    });
                }
            });
            Object.entries(categoryPriorities).forEach(([category, boost]) => {
                shouldClauses.push({
                    term: {
                        "category.keyword": {
                            value: category,
                            boost: boost
                        }
                    }
                });
            });
        }
        for (const keyword of filters.keywords || []) {
            if (keyword.length > 2) {
                shouldClauses.push({
                    multi_match: {
                        query: keyword,
                        fields: [
                            "name^3", 
                            "title^3", 
                            "description^2", 
                            "category^2", 
                            "subcategory^2.5", 
                            "brand^2", 
                            "tags^2", 
                            "features^1.5"
                        ],
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
        }
        if (filters.brand) {
            filterClauses.push({ term: { "brand.keyword": filters.brand } });
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
            filterClauses.push({ range: { averageRating: { gte: filters.rating_min } } });
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
                    { "price": { order: "asc", "missing": "_last" } }
                ],
                size: 60
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
                    { "price": { order: "asc", "missing": "_last" } }
                ],
                size: 60
            };
        }
        let response = await esClient.search({
            index: 'products',
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
                                    fields: [
                                        "name^3", 
                                        "title^3", 
                                        "description^2", 
                                        "category^2", 
                                        "subcategory^2.5", 
                                        "brand^2", 
                                        "tags^2", 
                                        "features^1.5"
                                    ],
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
                    { "price": { order: "asc", "missing": "_last" } }
                ],
                size: 60
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
        const mongoClient = getMongoClient();
        if (mongoClient) {
            const db = mongoClient.db('ecommerce');
            const reviewCollection = db.collection('reviews');
            for (const product of products) {
                try {
                    product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
                } catch (error) {
                    console.error('Error fetching reviews for product:', error);
                    product.reviews = [];
                }
            }
        }
        return products;
    }
    async searchWithMongoDB(mongoClient, query, filters, semanticAnalysis = null) {
        const db = mongoClient.db('ecommerce');
        const collection = db.collection('products');
        const reviewCollection = db.collection('reviews');
        console.log('MongoDB search query:', query);
        let mongoQuery = {};
        let products = [];
        if (semanticAnalysis && semanticAnalysis.isColorSearch && semanticAnalysis.detectedColor) {
            console.log(`Color search detected: ${semanticAnalysis.detectedColor}`);
            const colorFilterConditions = [];
            colorFilterConditions.push({ 
                color: { $regex: semanticAnalysis.detectedColor, $options: 'i' } 
            });
            if (semanticAnalysis.detectedIntents.includes('FOOTWEAR_SEARCH')) {
                colorFilterConditions.push({ category: 'footwear' });
            } else if (semanticAnalysis.detectedIntents.includes('CLOTHING_SEARCH')) {
                colorFilterConditions.push({ category: 'fashion' });
            } else if (semanticAnalysis.detectedIntents.includes('ELECTRONICS_SEARCH')) {
                colorFilterConditions.push({ category: 'electronics' });
            }
            if (filters.brand) {
                colorFilterConditions.push({ brand: { $regex: filters.brand, $options: 'i' } });
            }
            if (filters.price_max) {
                colorFilterConditions.push({ price: { $lte: filters.price_max } });
            }
            if (filters.price_min) {
                colorFilterConditions.push({ price: { $gte: filters.price_min } });
            }
            const colorQuery = { $and: colorFilterConditions };
            console.log('MongoDB color-specific query:', JSON.stringify(colorQuery, null, 2));
            const colorProducts = await collection.find(colorQuery)
                .sort({ 
                    averageRating: -1, 
                    totalReviews: -1, 
                    createdAt: -1  
                })
                .limit(30)
                .toArray();
            console.log(`Color-specific search found ${colorProducts.length} products`);
            if (colorProducts.length > 0) {
                products = colorProducts;
                for (const product of products) {
                    product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
                }
                return { products: products, wasCategorySearch: true };
            }
        }
        try {
            mongoQuery = { $text: { $search: query } };
            const filterConditions = [];
            if (filters.brand) {
                filterConditions.push({ brand: { $regex: filters.brand, $options: 'i' } });
            }
            if (filters.gender) {
                filterConditions.push({ gender: { $regex: filters.gender, $options: 'i' } });
            }
            if (filters.season) {
                filterConditions.push({ season: { $regex: filters.season, $options: 'i' } });
            }
            if (filters.category) {
                filterConditions.push({
                    $or: [
                        { category: { $regex: filters.category, $options: 'i' } },
                        { subcategory: { $regex: filters.category, $options: 'i' } }
                    ]
                });
            }
            if (filters.price_max) {
                filterConditions.push({ price: { $lte: filters.price_max } });
            }
            if (filters.price_min) {
                filterConditions.push({ price: { $gte: filters.price_min } });
            }
            if (filters.rating_min) {
                filterConditions.push({ averageRating: { $gte: filters.rating_min } });
            }
            if (filterConditions.length > 0) {
                mongoQuery = {
                    $and: [
                        { $text: { $search: query } },
                        ...filterConditions
                    ]
                };
            }
            console.log('MongoDB text search query:', JSON.stringify(mongoQuery, null, 2));
            products = await collection.find(mongoQuery)
                .sort({ 
                    score: { $meta: "textScore" },
                    averageRating: -1, 
                    totalReviews: -1, 
                    createdAt: -1  
                })
                .limit(60)
                .toArray();
            console.log(`MongoDB text search found ${products.length} products`);
            for (const product of products) {
                product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
            }
        } catch (textSearchError) {
            console.log('Text search failed, trying regex search:', textSearchError.message);
            const regexQuery = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } },
                    { subcategory: { $regex: query, $options: 'i' } },
                    { brand: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } },
                    { features: { $in: [new RegExp(query, 'i')] } }
                ]
            };
            const filterConditions = [];
            if (filters.brand) {
                filterConditions.push({ brand: { $regex: filters.brand, $options: 'i' } });
            }
            if (filters.gender) {
                filterConditions.push({ gender: { $regex: filters.gender, $options: 'i' } });
            }
            if (filters.season) {
                filterConditions.push({ season: { $regex: filters.season, $options: 'i' } });
            }
            if (filters.category) {
                filterConditions.push({
                    $or: [
                        { category: { $regex: filters.category, $options: 'i' } },
                        { subcategory: { $regex: filters.category, $options: 'i' } }
                    ]
                });
            }
            if (filters.price_max) {
                filterConditions.push({ price: { $lte: filters.price_max } });
            }
            if (filters.price_min) {
                filterConditions.push({ price: { $gte: filters.price_min } });
            }
            if (filters.rating_min) {
                filterConditions.push({ averageRating: { $gte: filters.rating_min } });
            }
            if (filterConditions.length > 0) {
                mongoQuery = {
                    $and: [
                        regexQuery,
                        ...filterConditions
                    ]
                };
            } else {
                mongoQuery = regexQuery;
            }
            console.log('MongoDB regex search query:', JSON.stringify(mongoQuery, null, 2));
            products = await collection.find(mongoQuery)
                .sort({ 
                    averageRating: -1, 
                    totalReviews: -1, 
                    createdAt: -1,  
                    price: 1 
                })
                .limit(60)
                .toArray();
            console.log(`MongoDB regex search found ${products.length} products`);
            for (const product of products) {
                product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
            }
        }
        if (products.length === 0) {
            console.log('Trying category-based search as last resort...');
            const categoryMappings = {
                'accessories': ['accessories'],
                'backpack': ['backpacks', 'luggage'],
                'bag': ['backpacks', 'handbags', 'luggage'],
                'laptop': ['laptops', 'electronics'],
                'phone': ['smartphones', 'electronics'],
                'smartphone': ['smartphones', 'electronics'],
                'shoes': ['shoes', 'footwear', 'fashion'],
                'clothing': ['fashion'],
                'clothes': ['fashion'],
                'electronics': ['electronics'],
                'fashion': ['fashion'],
                'wildcraft': [] 
            };
            const queryLower = query.toLowerCase();
            let categoryQuery = null;
            for (const [keyword, categories] of Object.entries(categoryMappings)) {
                if (queryLower.includes(keyword)) {
                    if (categories.length > 0) {
                        categoryQuery = {
                            $or: [
                                ...categories.map(cat => ({ category: { $regex: cat, $options: 'i' } })),
                                ...categories.map(cat => ({ subcategory: { $regex: cat, $options: 'i' } }))
                            ]
                        };
                    } else {
                        categoryQuery = { brand: { $regex: keyword, $options: 'i' } };
                    }
                    break;
                }
            }
            if (categoryQuery) {
                console.log('MongoDB category search query:', JSON.stringify(categoryQuery, null, 2));
                let finalCategoryQuery = categoryQuery;
                const additionalFilters = [];
                if (filters.price_min) {
                    additionalFilters.push({ price: { $gte: filters.price_min } });
                }
                if (filters.price_max) {
                    additionalFilters.push({ price: { $lte: filters.price_max } });
                }
                if (filters.rating_min) {
                    additionalFilters.push({ averageRating: { $gte: filters.rating_min } });
                }
                if (additionalFilters.length > 0) {
                    finalCategoryQuery = {
                        $and: [
                            categoryQuery,
                            ...additionalFilters
                        ]
                    };
                    console.log('Applied additional filters to category search:', JSON.stringify(additionalFilters, null, 2));
                }
                products = await collection.find(finalCategoryQuery)
                    .sort({ 
                        averageRating: -1, 
                        totalReviews: -1, 
                        createdAt: -1,  
                        price: 1 
                    })
                    .limit(60)
                    .toArray();
                console.log(`MongoDB category search found ${products.length} products`);
                for (const product of products) {
                    product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
                }
                return { products: products, wasCategorySearch: true };
            }
        }
        return { products: products, wasCategorySearch: false };
    }
    async getFallbackProducts(mongoClient, query) {
        const db = mongoClient.db('ecommerce');
        const collection = db.collection('products');
        const reviewCollection = db.collection('reviews');
        console.log('Getting fallback products with broad search criteria');
        try {
            const fallbackProducts = await collection.find({})
                .sort({ 
                    averageRating: -1, 
                    totalReviews: -1,
                    createdAt: -1
                })
                .limit(15)
                .toArray();
            for (const product of fallbackProducts) {
                product.reviews = await reviewCollection.find({ productId: product._id }).toArray();
            }
            return fallbackProducts;
        } catch (error) {
            console.error('Error in getFallbackProducts:', error);
            return [];
        }
    }
}
module.exports = new SearchService();
