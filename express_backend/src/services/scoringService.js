const natural = require('natural');
const stringSimilarity = require('string-similarity');

class ScoringService {
    constructor() {
        this.categoryMappings = {
            shoes: ['Footwear', 'Casual Shoes', 'Sports Shoes', 'Formal Shoes', 'Sneakers'],
            electronics: ['Electronics', 'Mobiles & Accessories', 'Laptops & Accessories', 'Audio'],
            fashion: ['Fashion', 'Men', 'Women', 'Kids'],
            beauty: ['Beauty & Personal Care', 'Makeup', 'Skincare', 'Haircare'],
            home: ['Home & Kitchen', 'Furniture', 'Home Decor', 'Kitchen & Dining'],
            appliances: ['Appliances', 'Large Appliances', 'Small Appliances'],
            books: ['Books & Stationery', 'Academic Books', 'Novels'],
            sports: ['Sports & Outdoors', 'Cricket', 'Footballs', 'Bicycles'],
            baby: ['Baby & Kids', 'Baby Clothing', 'Toys'],
            automotive: ['Automotive', 'Car Accessories', 'Bike Accessories']
        };

        this.productTypeDetectors = {
            shoes: ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'],
            electronics: ['phone', 'mobile', 'smartphone', 'tablet', 'laptop', 'electronic', 'device', 'gadget', 'headphone'],
            fashion: ['shirt', 't-shirt', 'tshirt', 'pant', 'dress', 'jacket', 'clothing', 'apparel', 'jeans', 'kurti', 'saree'],
            beauty: ['makeup', 'foundation', 'lipstick', 'shampoo', 'perfume', 'skincare'],
            home: ['furniture', 'sofa', 'bed', 'table', 'lamp', 'cookware'],
            appliances: ['refrigerator', 'microwave', 'washing', 'iron', 'vacuum'],
            books: ['book', 'novel', 'notebook', 'academic'],
            sports: ['sports', 'cricket', 'football', 'bicycle', 'fitness'],
            baby: ['baby', 'kids', 'toy', 'diaper'],
            automotive: ['car', 'bike', 'automotive', 'vehicle']
        };
    }

    async scoreAndRankResults(results, query, nlpAnalysis, semanticAnalysis, filters) {

        if (!results || results.length === 0) {
            return [];
        }

        const scoredResults = results.map(product => {
            const scores = this.calculateComprehensiveScore(product, query, nlpAnalysis, semanticAnalysis, filters);

            return {
                ...product,
                scores: scores,
                finalScore: scores.totalScore
            };
        });

        scoredResults.sort((a, b) => b.finalScore - a.finalScore);

        return scoredResults;
    }

    calculateComprehensiveScore(product, query, nlpAnalysis, semanticAnalysis, filters) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

        const textScore = this.calculateTextRelevanceScore(product, query, queryWords);

        const nlpScore = this.calculateNLPScore(product, nlpAnalysis);

        const semanticScore = this.calculateSemanticScore(product, semanticAnalysis);

        const categoryScore = this.calculateCategoryRelevanceScore(product, query, queryWords);

        const vectorScore = product.vectorScore || 0;

        const esScore = product._score ? Math.min(product._score / 10, 1) : 0;

        const fuzzyScore = product.fuseScore ? (1 - product.fuseScore) : 0;

        const multiModalScore = product.semanticSimilarity ?
            product.semanticSimilarity.aggregatedScore || 0 : 0;

        let totalScore;

        if (nlpAnalysis?.specifications?.processor ||
            (nlpAnalysis?.extractedFeatures?.processorBrands?.exclude?.length > 0)) {
            totalScore = (
                textScore * 0.15 +
                nlpScore * 0.45 +
                semanticScore * 0.10 +
                categoryScore * 0.10 +
                vectorScore * 0.05 +
                esScore * 0.05 +
                fuzzyScore * 0.05 +
                multiModalScore * 0.05
            );
        } else {

            totalScore = (
                textScore * 0.25 +
                nlpScore * 0.15 +
                semanticScore * 0.15 +
                categoryScore * 0.10 +
                vectorScore * 0.10 +
                esScore * 0.10 +
                fuzzyScore * 0.05 +
                multiModalScore * 0.10
            );
        }

        return {
            textScore,
            nlpScore,
            semanticScore,
            categoryScore,
            vectorScore,
            esScore,
            fuzzyScore,
            multiModalScore,
            totalScore
        };
    }

    calculateTextRelevanceScore(product, query, queryWords) {
        const productText = [
            product.name || '',
            product.title || '',
            product.description || '',
            product.category || '',
            product.subcategory || '',
            product.brand || '',
            (product.tags || []).join(' '),
            (product.features || []).join(' ')
        ].join(' ').toLowerCase();

        let score = 0;

        if (productText.includes(query.toLowerCase())) {
            score += 20;
        }

        queryWords.forEach(word => {
            if (productText.includes(word)) {
                score += 5;
            }
        });

        if ((product.name || '').toLowerCase().includes(query.toLowerCase())) score += 15;
        if ((product.title || '').toLowerCase().includes(query.toLowerCase())) score += 15;
        if ((product.category || '').toLowerCase().includes(query.toLowerCase())) score += 12;
        if ((product.brand || '').toLowerCase().includes(query.toLowerCase())) score += 8;

        const similarity = stringSimilarity.compareTwoStrings(productText, query.toLowerCase());
        score += similarity * 10;

        return Math.min(score, 100);
    }

    calculateNLPScore(product, nlpAnalysis) {
        if (!nlpAnalysis) return 0;

        let score = 0;
        const productText = [
            product.name || '',
            product.title || '',
            product.description || '',
            product.category || '',
            product.subcategory || '',
            product.brand || '',
            product.processor || '',
            product.specifications || ''
        ].join(' ').toLowerCase();

        if (nlpAnalysis.specifications?.processor) {
            const requestedProcessor = nlpAnalysis.specifications.processor;

            if (nlpAnalysis.extractedFeatures?.processorBrands?.exclude) {
                const incompatibleBrands = nlpAnalysis.extractedFeatures.processorBrands.exclude;
                let hasIncompatibleBrand = false;

                incompatibleBrands.forEach(excludeBrand => {
                    if (productText.includes(excludeBrand.toLowerCase())) {
                        score -= 200;
                        hasIncompatibleBrand = true;
                    }
                });

                if (hasIncompatibleBrand) {
                    score -= 100;
                }
            }

            if (productText.includes(requestedProcessor.toLowerCase())) {
                score += 150;

                if (!nlpAnalysis.extractedFeatures?.processorBrands?.exclude?.some(brand =>
                    productText.includes(brand.toLowerCase()))) {
                    score += 50;
                }
            }

            const processorSynonyms = {
                'snapdragon': ['qualcomm', 'snapdragon'],
                'apple': ['bionic', 'a17', 'a16', 'a15', 'apple silicon'],
                'mediatek': ['dimensity', 'helio'],
                'exynos': ['samsung exynos']
            };

            if (processorSynonyms[requestedProcessor]) {
                processorSynonyms[requestedProcessor].forEach(synonym => {
                    if (productText.includes(synonym.toLowerCase()) && !productText.includes(requestedProcessor.toLowerCase())) {
                        score += 75;
                    }
                });
            }
        }

        if (nlpAnalysis.extractedFeatures?.brands) {
            const preferredBrands = nlpAnalysis.extractedFeatures.brands.include || [];
            const excludedBrands = nlpAnalysis.extractedFeatures.brands.exclude || [];

            preferredBrands.forEach(brand => {
                if (productText.includes(brand.toLowerCase())) {
                    score += 40;
                }
            });

            excludedBrands.forEach(brand => {
                if (productText.includes(brand.toLowerCase())) {
                    score -= 80;
                }
            });
        }

        if (nlpAnalysis.tokens) {
            const matchedTokens = nlpAnalysis.tokens.filter(token =>
                productText.includes(token.toLowerCase())
            );
            score += (matchedTokens.length / nlpAnalysis.tokens.length) * 30;
        }

        if (nlpAnalysis.features && nlpAnalysis.features.length > 0) {
            nlpAnalysis.features.forEach(feature => {
                if (productText.includes(feature.toLowerCase())) {
                    if (feature.includes('processor')) {
                        score += 25;
                    } else {
                        score += 10;
                    }
                }
            });
        }

        if (nlpAnalysis.entities) {
            nlpAnalysis.entities.forEach(entity => {
                if (productText.includes(entity.text.toLowerCase())) {
                    score += 10;
                }
            });
        }

        if (nlpAnalysis.extractedFeatures?.categoryContext) {
            const preferredTerms = nlpAnalysis.extractedFeatures.categoryContext.include || [];
            const excludedTerms = nlpAnalysis.extractedFeatures.categoryContext.exclude || [];

            preferredTerms.forEach(term => {
                if (productText.includes(term.toLowerCase())) {
                    score += 35;
                }
            });

            excludedTerms.forEach(term => {
                if (productText.includes(term.toLowerCase())) {
                    score -= 45;
                }
            });
        }

        if (nlpAnalysis.categories && nlpAnalysis.categories.length > 0) {
            nlpAnalysis.categories.forEach(category => {
                if (productText.includes(category.toLowerCase())) {
                    score += 20;
                }
            });
        }

        if (nlpAnalysis.subcategories && nlpAnalysis.subcategories.length > 0) {
            nlpAnalysis.subcategories.forEach(subcategory => {
                if (productText.includes(subcategory.toLowerCase())) {
                    score += 25;
                }
            });
        }

        if (nlpAnalysis.confidence && !isNaN(nlpAnalysis.confidence)) {
            score += nlpAnalysis.confidence * 10;
        }

        const finalScore = isNaN(score) ? 0 : Math.min(Math.max(score, -500), 300);

        return finalScore;
    }

    calculateSemanticScore(product, semanticAnalysis) {
        if (!semanticAnalysis) return 0;

        let score = 0;
        const productText = [
            product.name || '',
            product.title || '',
            product.description || '',
            product.category || '',
            product.subcategory || ''
        ].join(' ').toLowerCase();

        if (semanticAnalysis.detectedIntents) {
            semanticAnalysis.detectedIntents.forEach(intent => {
                if (productText.includes(intent.toLowerCase())) {
                    score += 15;
                }
            });
        }

        if (semanticAnalysis.categoryPriorities) {
            Object.entries(semanticAnalysis.categoryPriorities).forEach(([category, priority]) => {
                if ((product.category || '').toLowerCase().includes(category.toLowerCase()) ||
                    (product.subcategory || '').toLowerCase().includes(category.toLowerCase())) {
                    score += priority * 10;
                }
            });
        }

        if (semanticAnalysis.expandedTerms) {
            semanticAnalysis.expandedTerms.forEach(term => {
                if (productText.includes(term.toLowerCase())) {
                    score += 3;
                }
            });
        }

        if (semanticAnalysis.confidence) {
            score += semanticAnalysis.confidence * 5;
        }

        return Math.min(score, 100);
    }

    calculateCategoryRelevanceScore(product, query, queryWords) {
        let score = 0;
        const queryLower = query.toLowerCase();

        Object.entries(this.productTypeDetectors).forEach(([type, keywords]) => {
            const matchedKeywords = keywords.filter(keyword =>
                queryWords.some(word => word.includes(keyword) || keyword.includes(word))
            );

            if (matchedKeywords.length > 0) {

                const relevantCategories = this.categoryMappings[type] || [];
                const productCategory = product.category || '';
                const productSubcategory = product.subcategory || '';

                const categoryMatch = relevantCategories.some(cat =>
                    productCategory.toLowerCase().includes(cat.toLowerCase()) ||
                    productSubcategory.toLowerCase().includes(cat.toLowerCase())
                );

                if (categoryMatch) {
                    score += 20;
                }
            }
        });

        return Math.min(score, 100);
    }
}

function applyNLPScoring(products, filters, originalQuery) {
    const scoringService = new ScoringService();
    const mockNlpAnalysis = {
        tokens: originalQuery.split(' '),
        confidence: 0.5
    };
    const mockSemanticAnalysis = filters.semantic_analysis || {};

    return scoringService.scoreAndRankResults(
        products,
        originalQuery,
        mockNlpAnalysis,
        mockSemanticAnalysis,
        filters
    );
}

module.exports = new ScoringService();
module.exports.applyNLPScoring = applyNLPScoring;