const Fuse = require('fuse.js');
const cosineSimilarity = require('cosine-similarity');
const stringSimilarity = require('string-similarity');
const natural = require('natural');

let leven;
(async () => {
    const levenModule = await import('leven');
    leven = levenModule.default;
})();

class MultiModalSearchService {
    constructor() {
        this.fuseOptions = {
            keys: ['name', 'title', 'description', 'category', 'subcategory', 'brand', 'tags', 'features'],
            threshold: 0.6,
            distance: 100,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: true
        };
    }

    async elasticsearchSearch(esClient, query, filters, nlpAnalysis) {
        if (!esClient) {
            return [];
        }

        try {

            const searchBody = {
                query: {
                    bool: {
                        should: [

                            {
                                multi_match: {
                                    query: query,
                                    fields: [
                                        'name^3',
                                        'title^3',
                                        'description^2',
                                        'category^2.5',
                                        'subcategory^2.5',
                                        'brand^2',
                                        'tags^1.5',
                                        'features^1.5'
                                    ],
                                    type: 'best_fields',
                                    fuzziness: 'AUTO'
                                }
                            },

                            ...(nlpAnalysis.keywords || nlpAnalysis.tokens || []).map(token => ({
                                multi_match: {
                                    query: token,
                                    fields: ['name^2', 'title^2', 'category^2', 'subcategory^2'],
                                    fuzziness: 'AUTO',
                                    boost: 1.5
                                }
                            }))
                        ],
                        minimum_should_match: 1
                    }
                },
                size: 50,
                _source: true
            };

            const response = await esClient.search({
                index: 'products',
                body: searchBody
            });

            const hits = response.body?.hits?.hits || response.hits?.hits || [];

            return hits.map(hit => ({
                ...hit._source,
                _score: hit._score,
                searchType: 'elasticsearch'
            }));
        } catch (error) {
            console.error('Elasticsearch search failed:', error);
            return [];
        }
    }

    async fuzzySearch(products, query, nlpAnalysis) {

        if (!products || products.length === 0) return [];

        const fuse = new Fuse(products, this.fuseOptions);

        let fuseResults = fuse.search(query);

        nlpAnalysis.tokens.forEach(token => {
            if (token.length > 2) {
                const tokenResults = fuse.search(token);
                fuseResults = fuseResults.concat(tokenResults);
            }
        });

        const uniqueResults = [];
        const seenIds = new Set();

        fuseResults.forEach(result => {
            const id = result.item._id || result.item.id;
            if (!seenIds.has(id?.toString())) {
                seenIds.add(id?.toString());
                uniqueResults.push({
                    ...result.item,
                    fuseScore: result.score,
                    searchType: 'fuzzy'
                });
            }
        });

        return uniqueResults;
    }

    calculateSemanticSimilarity(product, query, nlpAnalysis) {
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

        const queryText = query.toLowerCase();

        const stringSim = stringSimilarity.compareTwoStrings(productText, queryText);

        let normalizedLeven = 0;
        if (leven) {
            try {
                const levenDist = leven(productText.substring(0, 100), queryText.substring(0, 100));
                const maxLen = Math.max(productText.length, queryText.length);
                normalizedLeven = maxLen > 0 ? 1 - (levenDist / maxLen) : 0;
            } catch (error) {

                normalizedLeven = stringSimilarity.compareTwoStrings(productText.substring(0, 100), queryText.substring(0, 100));
            }
        } else {

            normalizedLeven = stringSimilarity.compareTwoStrings(productText.substring(0, 100), queryText.substring(0, 100));
        }

        const tokenizer = new natural.WordTokenizer();
        const productTokens = tokenizer.tokenize(productText) || [];
        const queryTokens = nlpAnalysis.tokens;
        const overlap = queryTokens.filter(token =>
            productTokens.some(pToken => pToken.includes(token) || token.includes(pToken))
        ).length;
        const tokenSim = queryTokens.length > 0 ? overlap / queryTokens.length : 0;

        const productFreq = this.getTokenFrequency(productTokens);
        const queryFreq = this.getTokenFrequency(queryTokens);
        const cosineScore = this.calculateCosineScore(productFreq, queryFreq);

        const aggregatedScore = (
            stringSim * 0.3 +
            normalizedLeven * 0.2 +
            tokenSim * 0.3 +
            cosineScore * 0.2
        );

        return {
            stringSimilarity: stringSim,
            levenshteinSimilarity: normalizedLeven,
            tokenSimilarity: tokenSim,
            cosineSimilarity: cosineScore,
            aggregatedScore: aggregatedScore
        };
    }

    getTokenFrequency(tokens) {
        const freq = {};
        tokens.forEach(token => {
            freq[token] = (freq[token] || 0) + 1;
        });
        return freq;
    }

    calculateCosineScore(freq1, freq2) {
        const allTokens = [...new Set([...Object.keys(freq1), ...Object.keys(freq2)])];
        if (allTokens.length === 0) return 0;

        const vector1 = allTokens.map(token => freq1[token] || 0);
        const vector2 = allTokens.map(token => freq2[token] || 0);

        try {
            return cosineSimilarity(vector1, vector2) || 0;
        } catch (error) {
            return 0;
        }
    }

    reRankResults(allResults, query, nlpAnalysis) {

        const rankedResults = allResults.map(product => {
            let finalScore = 0;
            let scoreBreakdown = {};
            let qualityMultiplier = 1.0;

            let categoryScore = 0;
            if (nlpAnalysis.category && product.category) {
                if (product.category.toLowerCase() === nlpAnalysis.category.toLowerCase()) {
                    categoryScore = 1000;
                } else if (product.category.toLowerCase().includes(nlpAnalysis.category.toLowerCase())) {
                    categoryScore = 800;
                } else if (nlpAnalysis.category.toLowerCase().includes(product.category.toLowerCase())) {
                    categoryScore = 600;
                }
            }
            scoreBreakdown.category = categoryScore;
            finalScore += categoryScore;

            let subcategoryScore = 0;
            if (nlpAnalysis.subcategory && product.subcategory) {
                if (product.subcategory.toLowerCase() === nlpAnalysis.subcategory.toLowerCase()) {
                    subcategoryScore = 500;
                } else if (product.subcategory.toLowerCase().includes(nlpAnalysis.subcategory.toLowerCase())) {
                    subcategoryScore = 400;
                } else if (nlpAnalysis.subcategory.toLowerCase().includes(product.subcategory.toLowerCase())) {
                    subcategoryScore = 300;
                }
            }
            scoreBreakdown.subcategory = subcategoryScore;
            finalScore += subcategoryScore;

            let featureScore = 0;
            let exactFeatureMatches = 0;
            let partialFeatureMatches = 0;
            let chipSpecificMatch = false;

            if (nlpAnalysis.features && nlpAnalysis.features.length > 0) {
                const productFeatures = [
                    ...(product.features || []),
                    ...(product.tags || []),
                    product.description || '',
                    product.name || '',
                    product.title || ''
                ].join(' ').toLowerCase();

                nlpAnalysis.features.forEach(feature => {
                    if (feature && feature.length > 1) {
                        const featureLower = feature.toLowerCase();

                        if (nlpAnalysis.searchTerms.some(term =>
                            ['a15', 'a16', 'a17', 'snapdragon', 'mediatek', 'exynos', 'chip', 'processor'].includes(term.toLowerCase())
                        )) {

                            if (['a15', 'bionic'].includes(featureLower)) {

                                if (productFeatures.includes('a15 bionic') ||
                                    productFeatures.includes('a15bionic') ||
                                    (productFeatures.includes('a15') && productFeatures.includes('bionic'))) {
                                    featureScore += 200;
                                    exactFeatureMatches++;
                                    chipSpecificMatch = true;
                                } else if (product.name && product.name.toLowerCase().includes('a15') &&
                                          !productFeatures.includes('a15 bionic')) {

                                    featureScore -= 100;
                                }
                            }
                        }

                        if (!['a15', 'bionic', 'chip', 'processor'].includes(featureLower)) {

                            if (product.features && product.features.some(f => f.toLowerCase().includes(featureLower))) {
                                featureScore += 80;
                                exactFeatureMatches++;
                            } else if (product.tags && product.tags.some(t => t.toLowerCase().includes(featureLower))) {
                                featureScore += 70;
                                exactFeatureMatches++;
                            } else if (product.name && product.name.toLowerCase().includes(featureLower)) {
                                featureScore += 60;
                                partialFeatureMatches++;
                            } else if (productFeatures.includes(featureLower)) {
                                featureScore += 40;
                                partialFeatureMatches++;
                            }
                        }
                    }
                });

                if (exactFeatureMatches >= 2) {
                    featureScore += 100;
                    qualityMultiplier += 0.1;
                }

                if (chipSpecificMatch) {
                    featureScore += 100;
                    qualityMultiplier += 0.15;
                }

                featureScore = Math.min(featureScore, 500);
            }
            scoreBreakdown.features = featureScore;
            finalScore += featureScore;

            let brandScore = 0;
            if (nlpAnalysis.brand && product.brand) {
                if (product.brand.toLowerCase() === nlpAnalysis.brand.toLowerCase()) {
                    brandScore = 250;
                    qualityMultiplier += 0.05;
                } else if (product.brand.toLowerCase().includes(nlpAnalysis.brand.toLowerCase())) {
                    brandScore = 200;
                } else if (product.name && product.name.toLowerCase().includes(nlpAnalysis.brand.toLowerCase())) {
                    brandScore = 150;
                }
            }
            scoreBreakdown.brand = brandScore;
            finalScore += brandScore;

            let searchTermsScore = 0;
            let criticalTermMatches = 0;

            if (nlpAnalysis.searchTerms && nlpAnalysis.searchTerms.length > 0) {
                const productText = [
                    product.name || '',
                    product.title || '',
                    product.description || '',
                    (product.tags || []).join(' '),
                    (product.features || []).join(' ')
                ].join(' ').toLowerCase();

                nlpAnalysis.searchTerms.forEach(term => {
                    if (term && term.length > 1) {
                        const termLower = term.toLowerCase();

                        if (product.name && product.name.toLowerCase().includes(termLower)) {
                            searchTermsScore += 50;
                            criticalTermMatches++;
                        } else if (product.title && product.title.toLowerCase().includes(termLower)) {
                            searchTermsScore += 40;
                            criticalTermMatches++;
                        } else if (productText.includes(termLower)) {
                            searchTermsScore += 25;
                        }
                    }
                });

                if (criticalTermMatches >= 2) {
                    searchTermsScore += 50;
                    qualityMultiplier += 0.05;
                }
            }
            scoreBreakdown.searchTerms = searchTermsScore;
            finalScore += searchTermsScore;

            let contextScore = 0;

            if (nlpAnalysis.intent) {
                switch (nlpAnalysis.intent) {
                    case 'feature-focused':
                        if (exactFeatureMatches > 0) contextScore += 100;
                        if (partialFeatureMatches > 0) contextScore += 50;
                        break;
                    case 'brand-focused':
                        if (brandScore > 0) contextScore += 100;
                        break;
                    case 'category-focused':
                        if (categoryScore >= 1000) contextScore += 100;
                        if (subcategoryScore >= 500) contextScore += 50;
                        break;
                    case 'price-focused':

                        contextScore += 50;
                        break;
                }
            }

            if (product.features && product.features.length > 3) contextScore += 20;
            if (product.averageRating && product.averageRating >= 4.0) contextScore += 20;
            if (product.totalReviews && product.totalReviews >= 5) contextScore += 10;

            scoreBreakdown.context = contextScore;
            finalScore += contextScore;

            let genderScore = 0;
            if (nlpAnalysis.gender && (nlpAnalysis.category === 'fashion' || nlpAnalysis.category === 'footwear')) {

                if (product.gender) {
                    if (product.gender.toLowerCase() === nlpAnalysis.gender.toLowerCase()) {
                        genderScore = 150;
                    } else if (product.gender.toLowerCase() === 'unisex') {
                        genderScore = 100;
                    } else {

                        genderScore = -200;
                    }
                } else {

                    const productText = [
                        product.name || '',
                        product.title || '',
                        product.description || ''
                    ].join(' ').toLowerCase();

                    const genderIndicators = {
                        male: ['men', 'man', 'boy', 'boys', 'mens', 'masculine'],
                        female: ['women', 'woman', 'girl', 'girls', 'womens', 'ladies', 'feminine']
                    };

                    const targetGenderIndicators = genderIndicators[nlpAnalysis.gender] || [];
                    const oppositeGenderIndicators = nlpAnalysis.gender === 'male' ? genderIndicators.female : genderIndicators.male;

                    const hasTargetGender = targetGenderIndicators.some(indicator =>
                        productText.includes(indicator)
                    );

                    const hasOppositeGender = oppositeGenderIndicators.some(indicator =>
                        productText.includes(indicator)
                    );

                    if (hasTargetGender && !hasOppositeGender) {
                        genderScore = 120;
                    } else if (hasOppositeGender) {
                        genderScore = -150;
                    } else {
                        genderScore = 50;
                    }
                }
            }
            scoreBreakdown.gender = genderScore;
            finalScore += genderScore;

            const similarity = this.calculateSemanticSimilarity(product, query, nlpAnalysis);
            const textScore = similarity.aggregatedScore * 100;
            scoreBreakdown.textSimilarity = textScore;
            finalScore += textScore;

            let engineScore = 0;
            if (product.searchType === 'elasticsearch' && product._score) {
                engineScore = Math.min(product._score * 5, 50);
            }
            if (product.searchType === 'fuzzy' && product.fuseScore) {
                engineScore = Math.min((1 - product.fuseScore) * 50, 50);
            }
            scoreBreakdown.engine = engineScore;
            finalScore += engineScore;

            let penalty = 0;
            let outlierPenalty = 0;

            if (nlpAnalysis.category && product.category) {
                const queryCategory = nlpAnalysis.category.toLowerCase();
                const productCategory = product.category.toLowerCase();

                if ((queryCategory === 'electronics' && !['electronics', 'technology'].includes(productCategory)) ||
                    (queryCategory === 'fashion' && !['fashion', 'clothing', 'apparel'].includes(productCategory)) ||
                    (queryCategory === 'smartphones' && productCategory !== 'electronics')) {
                    penalty = 800;
                }
            }

            if (textScore > 60 && categoryScore < 500 && featureScore < 100) {
                outlierPenalty = 300;
            }

            if (categoryScore === 0 && subcategoryScore === 0 && featureScore < 50) {
                outlierPenalty += 500;
            }

            if (partialFeatureMatches > exactFeatureMatches * 3 && exactFeatureMatches < 2) {
                outlierPenalty += 200;
            }

            if (nlpAnalysis.searchTerms.some(term =>
                ['a15', 'a16', 'a17', 'bionic', 'snapdragon', 'mediatek', 'exynos'].includes(term.toLowerCase())
            )) {

                const queryChips = nlpAnalysis.searchTerms.filter(term =>
                    ['a15', 'a16', 'a17', 'bionic', 'snapdragon', 'mediatek', 'exynos'].includes(term.toLowerCase())
                );

                const productText = [
                    product.name || '',
                    product.title || '',
                    product.description || '',
                    ...(product.features || []),
                    ...(product.tags || [])
                ].join(' ').toLowerCase();

                let hasActualChipMatch = false;

                if (queryChips.includes('a15') || queryChips.includes('bionic')) {
                    hasActualChipMatch = productText.includes('a15 bionic') ||
                                       (productText.includes('a15') && productText.includes('bionic'));
                }

                if (!hasActualChipMatch && (product.name && product.name.toLowerCase().includes('a15'))) {
                    outlierPenalty += 400;
                }

                if (!chipSpecificMatch && featureScore <= 0) {
                    outlierPenalty += 300;
                }
            }

            scoreBreakdown.penalty = penalty;
            scoreBreakdown.outlierPenalty = outlierPenalty;

            finalScore = (finalScore * qualityMultiplier) - penalty - outlierPenalty;
            finalScore = Math.max(0, finalScore);

            scoreBreakdown.qualityMultiplier = qualityMultiplier;
            scoreBreakdown.finalScore = finalScore;

            if (finalScore > 800) {
            }

            return {
                ...product,
                semanticSimilarity: similarity,
                finalScore: finalScore,
                scoreBreakdown: scoreBreakdown,
                qualityScore: qualityMultiplier,
                isOutlierCandidate: outlierPenalty > 0
            };
        });

        rankedResults.sort((a, b) => b.finalScore - a.finalScore);

        const processedResults = this.applyOutlierFiltering(rankedResults, nlpAnalysis);

        const outliers = processedResults.filter(r => r.isOutlierCandidate);
        if (outliers.length > 0) {
        }

        return processedResults;
    }

    applyOutlierFiltering(rankedResults, nlpAnalysis) {

        if (rankedResults.length === 0) return rankedResults;

        const topTier = rankedResults.filter(r => r.finalScore >= 1200);
        const highTier = rankedResults.filter(r => r.finalScore >= 800 && r.finalScore < 1200);
        const mediumTier = rankedResults.filter(r => r.finalScore >= 400 && r.finalScore < 800);
        const lowTier = rankedResults.filter(r => r.finalScore < 400);

        let filteredResults = [];

        const validTopTier = topTier.filter(result => {

            const hasCategoryMatch = result.scoreBreakdown.category >= 1000;
            const hasStrongFeatures = result.scoreBreakdown.features >= 200;
            const hasRelevantSearchTerms = result.scoreBreakdown.searchTerms >= 100;

            const isValid = hasCategoryMatch || (hasStrongFeatures && hasRelevantSearchTerms);

            if (!isValid) {
                result.finalScore *= 0.7;
            }

            return isValid;
        });

        filteredResults = [...validTopTier];

        const validHighTier = highTier.filter(result => {

            const hasCategoryRelevance = result.scoreBreakdown.category >= 500;
            const hasFeatureRelevance = result.scoreBreakdown.features >= 100;
            const hasSearchRelevance = result.scoreBreakdown.searchTerms >= 75;

            const isValid = hasCategoryRelevance || hasFeatureRelevance || hasSearchRelevance;

            if (!isValid) {
            }

            return isValid;
        });

        filteredResults = [...filteredResults, ...validHighTier];

        const validMediumTier = mediumTier.filter(result => {

            const hasAnyRelevance = (
                result.scoreBreakdown.category > 0 ||
                result.scoreBreakdown.features > 0 ||
                result.scoreBreakdown.searchTerms >= 50 ||
                result.scoreBreakdown.brand > 0
            );

            return hasAnyRelevance;
        });

        filteredResults = [...filteredResults, ...validMediumTier];

        const validLowTier = lowTier.filter(result => {

            const hasMinimalRelevance = (
                result.scoreBreakdown.category > 0 ||
                result.scoreBreakdown.searchTerms >= 25 ||
                (result.scoreBreakdown.textSimilarity >= 30 && result.scoreBreakdown.features > 0)
            );

            return hasMinimalRelevance;
        });

        filteredResults = [...filteredResults, ...validLowTier.slice(0, 20)];

        filteredResults.sort((a, b) => b.finalScore - a.finalScore);

        if (nlpAnalysis.category && filteredResults.length > 5) {
            const topResults = filteredResults.slice(0, 10);
            const categoryMismatches = topResults.filter(r =>
                r.scoreBreakdown.category < 500 && r.finalScore > 800
            );

            if (categoryMismatches.length > 0) {
                categoryMismatches.forEach(result => {
                    result.finalScore *= 0.8;
                    result.scoreBreakdown.consistencyPenalty = result.finalScore * 0.2;
                });

                filteredResults.sort((a, b) => b.finalScore - a.finalScore);
            }
        }

        return filteredResults;
    }

    async performMultiModalSearch(query, filters, nlpAnalysis, esClient, mongoClient) {

        let allResults = [];

        if (esClient) {
            const esResults = await this.elasticsearchSearch(esClient, query, filters, nlpAnalysis);
            allResults = allResults.concat(esResults);
        }

        if (mongoClient) {
            const mongoResults = await this.mongodbSearchEnhanced(mongoClient, query, filters, nlpAnalysis);
            allResults = allResults.concat(mongoResults);
        }

        const uniqueResults = this.removeDuplicates(allResults);

        const filteredResults = this.applyEnhancedFilters(uniqueResults, nlpAnalysis);

        let finalResults = filteredResults;
        if (filteredResults.length < 10) {
            const fuzzyResults = await this.fuzzySearch(filteredResults, query, nlpAnalysis);
            finalResults = this.removeDuplicates([...filteredResults, ...fuzzyResults]);
        }

        const rerankedResults = this.reRankResults(finalResults, query, nlpAnalysis);

        return rerankedResults;
    }

    async mongodbSearchEnhanced(mongoClient, query, filters, nlpAnalysis) {
        if (!mongoClient) {
            return [];
        }

        try {

            const db = mongoClient.db('ecommerce');
            const collection = db.collection('products');

            let allResults = [];

            if (nlpAnalysis.category) {

                const categoryQuery = {
                    $and: [
                        {
                            $or: [
                                { category: nlpAnalysis.category },
                                { category: new RegExp(nlpAnalysis.category, 'i') },
                                { subcategory: new RegExp(nlpAnalysis.category, 'i') }
                            ]
                        }
                    ]
                };

                if (nlpAnalysis.subcategory) {
                    categoryQuery.$and.push({
                        $or: [
                            { subcategory: nlpAnalysis.subcategory },
                            { subcategory: new RegExp(nlpAnalysis.subcategory, 'i') }
                        ]
                    });
                }

                if (nlpAnalysis.gender && (nlpAnalysis.category === 'fashion' || nlpAnalysis.category === 'footwear')) {
                    categoryQuery.$and.push({
                        $or: [
                            { gender: nlpAnalysis.gender },
                            { gender: 'unisex' },
                            { gender: { $exists: false } },

                            { name: new RegExp(nlpAnalysis.gender, 'i') },
                            { title: new RegExp(nlpAnalysis.gender, 'i') }
                        ]
                    });
                }

                if (nlpAnalysis.brand) {
                    categoryQuery.$and.push({
                        $or: [
                            { brand: new RegExp(nlpAnalysis.brand, 'i') },
                            { name: new RegExp(nlpAnalysis.brand, 'i') }
                        ]
                    });
                }

                if (nlpAnalysis.color) {
                    categoryQuery.$and.push({
                        $or: [
                            { color: new RegExp(nlpAnalysis.color, 'i') },
                            { name: new RegExp(nlpAnalysis.color, 'i') },
                            { title: new RegExp(nlpAnalysis.color, 'i') },
                            { description: new RegExp(nlpAnalysis.color, 'i') }
                        ]
                    });
                }

                if (nlpAnalysis.searchTerms && nlpAnalysis.searchTerms.length > 0) {
                    const searchTermConditions = [];
                    nlpAnalysis.searchTerms.forEach(term => {
                        if (term && term.length > 1) {
                            searchTermConditions.push(
                                { name: new RegExp(term, 'i') },
                                { title: new RegExp(term, 'i') },
                                { description: new RegExp(term, 'i') },
                                { tags: { $in: [new RegExp(term, 'i')] } },
                                { features: { $in: [new RegExp(term, 'i')] } },
                                { brand: new RegExp(term, 'i') }
                            );
                        }
                    });

                    if (searchTermConditions.length > 0) {
                        categoryQuery.$and.push({ $or: searchTermConditions });
                    }
                }

                const categoryResults = await collection.find(categoryQuery).limit(30).toArray();
                allResults = [...allResults, ...categoryResults];
            }

            if (nlpAnalysis.features && nlpAnalysis.features.length > 0 && allResults.length < 20) {

                const featureConditions = [];
                nlpAnalysis.features.forEach(feature => {
                    if (feature && feature.length > 1) {
                        featureConditions.push(
                            { features: { $in: [new RegExp(feature, 'i')] } },
                            { tags: { $in: [new RegExp(feature, 'i')] } },
                            { description: new RegExp(feature, 'i') },
                            { name: new RegExp(feature, 'i') },
                            { title: new RegExp(feature, 'i') }
                        );
                    }
                });

                if (featureConditions.length > 0) {
                    const featureQuery = { $or: featureConditions };
                    const featureResults = await collection.find(featureQuery).limit(20).toArray();

                    const existingIds = new Set(allResults.map(r => r._id.toString()));
                    const newFeatureResults = featureResults.filter(r => !existingIds.has(r._id.toString()));

                    allResults = [...allResults, ...newFeatureResults];
                }
            }

            if (nlpAnalysis.brand && allResults.length < 20) {

                const brandQuery = {
                    $or: [
                        { brand: new RegExp(nlpAnalysis.brand, 'i') },
                        { name: new RegExp(nlpAnalysis.brand, 'i') },
                        { title: new RegExp(nlpAnalysis.brand, 'i') }
                    ]
                };

                const brandResults = await collection.find(brandQuery).limit(15).toArray();

                const existingIds = new Set(allResults.map(r => r._id.toString()));
                const newBrandResults = brandResults.filter(r => !existingIds.has(r._id.toString()));

                allResults = [...allResults, ...newBrandResults];
            }

            if (allResults.length < 10) {

                try {

                    const textQuery = { $text: { $search: query } };
                    const textResults = await collection.find(textQuery).limit(20).toArray();

                    if (textResults.length > 0) {
                        const existingIds = new Set(allResults.map(r => r._id.toString()));
                        const newTextResults = textResults.filter(r => !existingIds.has(r._id.toString()));
                        allResults = [...allResults, ...newTextResults];
                    }
                } catch (textError) {

                    const regexQuery = {
                        $or: [
                            { name: new RegExp(query, 'i') },
                            { title: new RegExp(query, 'i') },
                            { description: new RegExp(query, 'i') },
                            { tags: { $in: [new RegExp(query, 'i')] } }
                        ]
                    };

                    const regexResults = await collection.find(regexQuery).limit(15).toArray();
                    const existingIds = new Set(allResults.map(r => r._id.toString()));
                    const newRegexResults = regexResults.filter(r => !existingIds.has(r._id.toString()));

                    allResults = [...allResults, ...newRegexResults];
                }
            }

            const resultsWithReviews = await this.populateReviews(allResults, db);

            return resultsWithReviews.map(result => ({
                ...result,
                searchType: 'mongodb-enhanced'
            }));

        } catch (error) {
            console.error('MongoDB enhanced search failed:', error);
            return [];
        }
    }

    applyEnhancedFilters(results, nlpAnalysis) {

        let filteredResults = [...results];
        const originalCount = results.length;

        if (nlpAnalysis.category) {

            const categoryMatches = filteredResults.filter(result => {
                if (!result.category) return false;

                const resultCategory = result.category.toLowerCase();
                const targetCategory = nlpAnalysis.category.toLowerCase();

                return resultCategory === targetCategory ||
                       resultCategory.includes(targetCategory) ||
                       targetCategory.includes(resultCategory);
            });

            if (categoryMatches.length > 0) {
                filteredResults = categoryMatches;
            } else {
            }
        }

        if (nlpAnalysis.subcategory && filteredResults.length > 0) {

            const subcategoryMatches = filteredResults.filter(result => {
                if (!result.subcategory) return false;

                const resultSubcategory = result.subcategory.toLowerCase();
                const targetSubcategory = nlpAnalysis.subcategory.toLowerCase();

                return resultSubcategory === targetSubcategory ||
                       resultSubcategory.includes(targetSubcategory) ||
                       targetSubcategory.includes(resultSubcategory);
            });

            if (subcategoryMatches.length > 0) {
                filteredResults = subcategoryMatches;
            } else {
            }
        }

        if (nlpAnalysis.extractedFeatures) {

            if (nlpAnalysis.extractedFeatures.processorBrands?.exclude) {
                const beforeCount = filteredResults.length;
                nlpAnalysis.extractedFeatures.processorBrands.exclude.forEach(excludeBrand => {
                    filteredResults = filteredResults.filter(result => {
                        const productText = [
                            result.name || '',
                            result.title || '',
                            result.description || '',
                            result.brand || '',
                            result.processor || ''
                        ].join(' ').toLowerCase();

                        return !productText.includes(excludeBrand.toLowerCase());
                    });
                });
            }

            if (nlpAnalysis.extractedFeatures.categoryContext?.exclude) {
                const beforeCount = filteredResults.length;
                nlpAnalysis.extractedFeatures.categoryContext.exclude.forEach(excludeTerm => {
                    filteredResults = filteredResults.filter(result => {
                        const productText = [
                            result.name || '',
                            result.title || '',
                            result.description || '',
                            result.category || '',
                            result.subcategory || ''
                        ].join(' ').toLowerCase();

                        return !productText.includes(excludeTerm.toLowerCase());
                    });
                });
            }
        }

        if (nlpAnalysis.price_min) {
            filteredResults = filteredResults.filter(result =>
                result.price && result.price >= nlpAnalysis.price_min
            );
        }

        if (nlpAnalysis.price_max) {
            filteredResults = filteredResults.filter(result =>
                result.price && result.price <= nlpAnalysis.price_max
            );
        }

        if (nlpAnalysis.brand) {
            const brandMatches = filteredResults.filter(result =>
                result.brand && result.brand.toLowerCase().includes(nlpAnalysis.brand.toLowerCase())
            );
            if (brandMatches.length > 0) {
                filteredResults = brandMatches;
            }
        }

        if (nlpAnalysis.color) {
            const colorMatches = filteredResults.filter(result => {
                const productText = [result.name || '', result.title || '', result.description || ''].join(' ').toLowerCase();
                return productText.includes(nlpAnalysis.color.toLowerCase());
            });
            if (colorMatches.length > 0) {
                filteredResults = colorMatches;
            }
        }

        return filteredResults;
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

    async populateReviews(products, db) {
        if (!products || products.length === 0) return products;

        try {
            const reviewsCollection = db.collection('reviews');
            const { ObjectId } = require('mongodb');

            const allReviewIds = [];
            products.forEach(product => {
                if (product.reviews && Array.isArray(product.reviews)) {
                    product.reviews.forEach(reviewId => {

                        if (typeof reviewId === 'string') {
                            allReviewIds.push(new ObjectId(reviewId));
                        } else if (reviewId instanceof ObjectId) {
                            allReviewIds.push(reviewId);
                        }
                    });
                }
            });

            if (allReviewIds.length === 0) return products;

            const allReviews = await reviewsCollection.find({
                _id: { $in: allReviewIds }
            }).toArray();

            const reviewMap = new Map();
            allReviews.forEach(review => {
                reviewMap.set(review._id.toString(), review);
            });

            return products.map(product => {
                if (!product.reviews || !Array.isArray(product.reviews)) {
                    return { ...product, reviews: [] };
                }

                const populatedReviews = product.reviews.map(reviewId => {
                    const reviewIdStr = reviewId.toString();
                    return reviewMap.get(reviewIdStr);
                }).filter(review => review !== undefined);

                return {
                    ...product,
                    reviews: populatedReviews
                };
            });

        } catch (error) {
            console.error('Error populating reviews:', error);
            return products;
        }
    }
}

module.exports = new MultiModalSearchService();