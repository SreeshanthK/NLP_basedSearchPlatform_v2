const { getNLPInstance } = require('../config/nlp');
const { preprocessQuery } = require('../utils/textUtils');
const compromise = require('compromise');
const natural = require('natural');
const stringSimilarity = require('string-similarity');

const stemmer = natural.PorterStemmer;
const lemmatizer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();
const stopwords = new Set(natural.stopwords);
const metaphone = new natural.Metaphone();
const soundex = natural.SoundEx;
const nGrams = natural.NGrams;
const distance = natural.JaroWinklerDistance;
const tfidf = new natural.TfIdf();

class ImprovedNLPService {
    constructor() {

        this.hierarchyWeights = {
            exactMatch: 1000,
            subcategoryExact: 800,
            categoryExact: 600,
            lemmaMatch: 400,
            stemMatch: 300,
            phoneticMatch: 200,
            fuzzyMatch: 100,
            contextualMatch: 150
        };

        this.customStopwords = new Set([
            ...natural.stopwords,
            'buy', 'purchase', 'get', 'find', 'search', 'looking', 'want', 'need', 'show', 'display',
            'good', 'best', 'top', 'great', 'nice', 'awesome', 'cool', 'perfect', 'amazing',
            'cheap', 'expensive', 'price', 'cost', 'budget', 'money', 'rs', 'rupees', 'inr',
            'online', 'store', 'shop', 'market', 'website', 'app', 'application',
            'product', 'item', 'thing', 'stuff', 'something', 'anything'
        ]);

        this.categoryHierarchy = {
            electronics: {
                synonyms: ['electronics', 'electronic', 'gadgets', 'gadget', 'devices', 'device', 'tech', 'technology', 'digital', 'smart'],
                stems: ['electron', 'gadget', 'devic', 'tech', 'digit', 'smart'],
                phonetic: ['ALKTRNKS', 'KJTS', 'TFSS', 'TKN'],
                subcategories: {
                    smartphones: {
                        synonyms: ['smartphone', 'smartphones', 'phone', 'phones', 'mobile', 'mobiles', 'cell phone', 'cellphone', 'iphone', 'android', 'handset'],
                        stems: ['smartphon', 'phone', 'mobil', 'cell', 'handset'],
                        phonetic: ['SMRTFN', 'FN', 'MBL'],
                        contextual: ['calling', 'messaging', 'apps', 'android', 'ios']
                    },
                    smartwatches: {
                        synonyms: ['smartwatch', 'smartwatches', 'smart watch', 'smart watches', 'watch', 'watches', 'wearable', 'fitness tracker', 'fitness watch', 'activity tracker'],
                        stems: ['smartwatch', 'watch', 'wearabl', 'fitness', 'tracker', 'activ'],
                        phonetic: ['SMRTWTX', 'WTX', 'WRBL', 'FTNS'],
                        contextual: ['fitness', 'health', 'steps', 'heart rate', 'notifications', 'time']
                    },
                    laptops: {
                        synonyms: ['laptop', 'laptops', 'notebook', 'notebooks', 'computer', 'computers', 'pc', 'macbook', 'ultrabook', 'gaming laptop', 'gaming laptops', 'workstation'],
                        stems: ['laptop', 'notebook', 'comput', 'ultrabook', 'workstat'],
                        phonetic: ['LPTP', 'NTBK', 'KMPTR'],
                        contextual: ['work', 'office', 'programming', 'gaming', 'study', 'portable', 'performance', 'gpu', 'graphics', 'processor', 'cpu', 'ram', 'ssd']
                    },
                    gaming_laptops: {
                        synonyms: ['gaming laptop', 'gaming laptops', 'gaming computer', 'gaming pc', 'gaming notebook', 'gamer laptop', 'game laptop'],
                        stems: ['gam', 'laptop', 'comput', 'notebook'],
                        phonetic: ['KMK', 'LPTP', 'KMPTR'],
                        contextual: ['gaming', 'game', 'gpu', 'graphics', 'rtx', 'gtx', 'nvidia', 'amd', 'performance', 'fps', 'high refresh', 'esports']
                    },
                    headphones: {
                        synonyms: ['headphone', 'headphones', 'earphone', 'earphones', 'headset', 'headsets', 'earbuds', 'buds', 'earpiece'],
                        stems: ['headphon', 'earphon', 'headset', 'earbud', 'bud'],
                        phonetic: ['HTFNS', 'RFNS', 'HTST', 'RBTS'],
                        contextual: ['music', 'audio', 'sound', 'listening', 'wireless', 'bluetooth']
                    }
                }
            },
            fashion: {
                synonyms: ['fashion', 'clothing', 'clothes', 'apparel', 'wear', 'outfit', 'garment', 'attire', 'dress', 'style'],
                stems: ['fashion', 'cloth', 'appar', 'wear', 'outfit', 'garment', 'attir', 'dress', 'styl'],
                phonetic: ['FXIN', 'KL0S', 'PRL', 'WR'],
                subcategories: {
                    tshirts: {
                        synonyms: ['t-shirt', 'tshirt', 't shirt', 'tee', 'top', 'mens t-shirt', 'womens t-shirt', 'mens t', 'mens tshirt', 'men t-shirt', 'men tshirt', 'ladies top'],
                        stems: ['tshirt', 'shirt', 'tee', 'top'],
                        phonetic: ['TXRT', 'XRT', 'T', 'TP'],
                        contextual: ['casual', 'cotton', 'round neck', 'half sleeve', 'printed']
                    },
                    shirts: {
                        synonyms: ['shirt', 'shirts', 'dress shirt', 'button down', 'formal shirt', 'casual shirt'],
                        stems: ['shirt', 'dress', 'button', 'formal', 'casual'],
                        phonetic: ['XRT', 'TRS', 'BTN'],
                        contextual: ['collar', 'sleeves', 'formal', 'office', 'business']
                    },
                    hoodies: {
                        synonyms: ['hoodie', 'hoodies', 'sweatshirt', 'pullover', 'sweater'],
                        stems: ['hoodi', 'sweatshirt', 'pullov', 'sweater'],
                        phonetic: ['HT', 'SWTXRT', 'PLFR'],
                        contextual: ['warm', 'winter', 'cozy', 'zip', 'pocket']
                    },
                    jackets: {
                        synonyms: ['jacket', 'jackets', 'blazer', 'coat', 'windbreaker', 'winter jacket', 'leather jacket', 'bomber jacket'],
                        stems: ['jacket', 'blazer', 'coat', 'windbreak', 'winter', 'leather', 'bomber'],
                        phonetic: ['JKT', 'BLSR', 'KT', 'WNTBRK'],
                        contextual: ['winter', 'cold', 'outer', 'layer', 'protection', 'formal']
                    },
                    dresses: {
                        synonyms: ['dress', 'dresses', 'gown', 'frock', 'maxi dress', 'mini dress', 'summer dress'],
                        stems: ['dress', 'gown', 'frock', 'maxi', 'mini', 'summer'],
                        phonetic: ['TRS', 'KN', 'FRK', 'MKS'],
                        contextual: ['elegant', 'formal', 'party', 'wedding', 'evening', 'casual']
                    },
                    summerwear: {
                        synonyms: ['summer wear', 'summer clothing', 'summer clothes', 'summerwear', 'light clothing', 'casual wear', 'beachwear'],
                        stems: ['summer', 'wear', 'light', 'casual', 'beach'],
                        phonetic: ['SMR', 'WR', 'LT', 'KSL'],
                        contextual: ['hot', 'warm', 'light', 'breathable', 'cotton', 'vacation', 'beach', 'outdoor']
                    }
                }
            },
            footwear: {
                synonyms: ['footwear', 'shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'slippers', 'footgear'],
                stems: ['footwear', 'shoe', 'sneaker', 'boot', 'sandal', 'slipper'],
                phonetic: ['FTWR', 'X', 'SNKRS', 'BT', 'SNTLS'],
                subcategories: {
                    sneakers: {
                        synonyms: ['sneakers', 'sneaker', 'shoes', 'running shoes', 'sports shoes', 'casual shoes', 'trainers'],
                        stems: ['sneaker', 'shoe', 'run', 'sport', 'casual', 'trainer'],
                        phonetic: ['SNKRS', 'X', 'RNK', 'SPRT'],
                        contextual: ['running', 'walking', 'sport', 'comfortable', 'athletic']
                    },
                    boots: {
                        synonyms: ['boots', 'boot', 'ankle boots', 'combat boots', 'leather boots', 'work boots'],
                        stems: ['boot', 'ankl', 'combat', 'leather', 'work'],
                        phonetic: ['BT', 'NKL', 'KMBT'],
                        contextual: ['leather', 'tough', 'winter', 'protective', 'high']
                    },
                    sandals: {
                        synonyms: ['sandals', 'sandal', 'flip flops', 'slippers', 'chappals', 'flats'],
                        stems: ['sandal', 'flip', 'flop', 'slipper', 'chappal', 'flat'],
                        phonetic: ['SNTL', 'FLP', 'SLPR'],
                        contextual: ['summer', 'open', 'comfortable', 'casual', 'light']
                    }
                }
            }
        };

        this.genderHierarchy = {
            male: {
                direct: ['men', 'man', 'male', 'boy', 'boys', 'mens', "men's", 'masculine'],
                contextual: ['brother', 'father', 'dad', 'husband', 'boyfriend', 'guy', 'guys', 'sir', 'gentleman'],
                stems: ['men', 'mal', 'boy', 'mascul'],
                phonetic: ['MN', 'ML', 'BY'],
                patterns: [
                    /\bfor (my|his|the) (brother|father|dad|husband|boyfriend|boy|man|guy)\b/i,
                    /\bmen['']?s\b|\bmens\b/i,
                    /\b(male|masculine) (style|clothing|wear)\b/i,
                    /\b(buy|get|purchase) for (him|brother|father|dad)\b/i,
                    /\b(he|his) (wants|needs|likes)\b/i
                ]
            },
            female: {
                direct: ['women', 'woman', 'female', 'girl', 'girls', 'womens', "women's", 'feminine', 'ladies', 'lady'],
                contextual: ['sister', 'mother', 'mom', 'wife', 'girlfriend', 'madam', 'miss'],
                stems: ['women', 'femal', 'girl', 'feminin', 'ladi'],
                phonetic: ['WMN', 'FML', 'KRL'],
                patterns: [
                    /\bfor (my|her|the) (sister|mother|mom|wife|girlfriend|girl|woman|lady)\b/i,
                    /\bwomen['']?s\b|\bwomens\b/i,
                    /\b(female|feminine) (style|clothing|wear)\b/i,
                    /\b(buy|get|purchase) for (her|sister|mother|mom)\b/i,
                    /\b(she|her) (wants|needs|likes)\b/i
                ]
            },
            unisex: {
                direct: ['unisex', 'everyone', 'anyone', 'people', 'adults', 'teens', 'kids', 'children'],
                contextual: ['family', 'couple', 'friends', 'office', 'team'],
                stems: ['unisex', 'peopl', 'adult', 'teen', 'kid', 'children'],
                phonetic: ['NSKIS', 'PPL', 'TLT']
            }
        };

        this.brands = {
            apple: ['apple', 'iphone', 'ipad', 'macbook', 'imac'],
            samsung: ['samsung', 'galaxy'],
            nike: ['nike', 'jordan', 'air max'],
            adidas: ['adidas', 'originals', 'boost'],
            sony: ['sony', 'playstation', 'xperia'],
            dell: ['dell', 'alienware', 'inspiron'],
            hp: ['hp', 'hewlett packard', 'pavilion'],
            lenovo: ['lenovo', 'thinkpad', 'ideapad'],
            bose: ['bose', 'quietcomfort'],
            jbl: ['jbl', 'harman'],
            google: ['google', 'pixel'],
            oneplus: ['oneplus', 'one plus'],
            xiaomi: ['xiaomi', 'mi', 'redmi'],
            oppo: ['oppo'],
            vivo: ['vivo'],
            realme: ['realme'],
            motorola: ['motorola', 'moto'],
            nokia: ['nokia']
        };

        this.colors = {
            black: ['black', 'dark', 'ebony'],
            white: ['white', 'ivory', 'cream'],
            red: ['red', 'crimson', 'scarlet'],
            blue: ['blue', 'navy', 'royal'],
            green: ['green', 'emerald', 'forest'],
            yellow: ['yellow', 'gold', 'amber'],
            orange: ['orange', 'coral'],
            purple: ['purple', 'violet'],
            pink: ['pink', 'rose'],
            brown: ['brown', 'tan', 'beige'],
            gray: ['gray', 'grey', 'silver']
        };

        this.featureKeywords = {
            charging: ["fast charging", "wireless charging", "quick charge", "rapid charge", "superfast", "turbo charging"],
            display: ["amoled", "oled", "lcd", "retina", "hd", "full hd", "4k", "super amoled", "dynamic amoled"],
            connectivity: ["5g", "4g", "wifi", "bluetooth", "nfc", "lte"],
            storage: ["storage", "memory", "ram", "gb", "tb", "128gb", "256gb", "512gb"],
            camera: ["camera", "megapixel", "mp", "selfie", "front camera", "rear camera", "triple camera", "quad camera"],
            audio: ["noise cancelling", "bass", "stereo", "surround", "dolby", "hi-fi"],
            design: ["waterproof", "water resistant", "durable", "lightweight", "premium", "metal", "glass"],
            processors: {
                snapdragon: ["snapdragon", "qualcomm", "snapdragon 8", "snapdragon 7", "snapdragon 6"],
                apple: ["a17", "a16", "a15", "bionic", "apple silicon"],
                mediatek: ["mediatek", "dimensity", "helio"],
                exynos: ["exynos", "samsung exynos"],
                generic: ["processor", "chipset", "performance", "octa core", "quad core"]
            },
            brands: {
                android: ["android", "google", "samsung", "xiaomi", "oneplus", "oppo", "vivo", "realme", "poco"],
                apple: ["iphone", "apple", "ios"],
                exclusions: {
                    "snapdragon": ["iphone", "apple", "ios", "a17", "a16", "a15", "bionic"],
                    "apple": ["android", "snapdragon", "qualcomm", "samsung", "xiaomi"]
                }
            }
        };

        this.priceIndicators = {
            max: ['under', 'below', 'less than', 'max', 'maximum', 'budget', 'within', 'up to', 'not more than', 'limit', 'cheaper', 'affordable', 'upto'],
            min: ['over', 'above', 'more than', 'min', 'minimum', 'starting', 'at least', 'from', 'premium', 'high end', 'expensive'],
            range: ['between', 'to', 'range', '-', 'price range', 'from', 'and']
        };
    }

    parseQueryWithNLP(query) {
        if (!query || typeof query !== 'string') {
            return this.getEmptyFilters();
        }

        const processedQuery = preprocessQuery(query);
        const queryLower = processedQuery.toLowerCase();

        const filters = {
            category: null,
            subcategory: null,
            brand: null,
            color: null,
            price_max: null,
            price_min: null,
            gender: null,
            rating_min: null,
            features: [],
            keywords: [],
            tokens: [],
            specifications: {},
            intent: 'general',
            searchTerms: [],
            nlp_analysis: {
                tokens: [],
                entities: [],
                lemmatized: [],
                corrected_query: processedQuery,
                confidence: 0.9,
                detectedFeatures: [],
                priceRange: {},
                colorDetected: null,
                brandDetected: null,
                categoryDetected: null,
                subcategoryDetected: null,
                genderDetected: null
            }
        };

        this.extractTokens(queryLower, filters);

        this.extractGender(queryLower, filters);

        this.extractCategories(queryLower, filters);

        this.extractBrands(queryLower, filters);

        this.extractColors(queryLower, filters);

        this.extractPriceInformation(queryLower, filters);

        this.extractFeatures(queryLower, filters);

        this.determineIntent(filters);

        this.generateSearchTerms(queryLower, filters);


        return filters;
    }

    extractTokens(queryLower, filters) {
        console.log(`🔤 Advanced Tokenization with Full NLP Power...`);

        const doc = compromise(queryLower);

        const nouns = doc.nouns().out('array');
        const adjectives = doc.adjectives().out('array');
        const verbs = doc.verbs().out('array');
        const entities = doc.people().out('array').concat(doc.places().out('array'));

        const naturalTokens = tokenizer.tokenize(queryLower) || [];

        const words = queryLower.split(/\s+/).filter(word => word.length > 1);

        const combinedTokens = [...new Set([...naturalTokens, ...words, ...nouns, ...adjectives, ...verbs])];

        const cleanedTokens = combinedTokens.filter(token =>
            !this.customStopwords.has(token.toLowerCase()) && token.length > 1
        );

        const stems = cleanedTokens.map(token => stemmer.stem(token.toLowerCase()));

        const lemmas = cleanedTokens.map(token => lemmatizer.stem(token.toLowerCase()));

        const phonetics = cleanedTokens.map(token => metaphone.process(token));

        const bigrams = nGrams.bigrams(cleanedTokens);
        const trigrams = nGrams.trigrams(cleanedTokens);
        const allNgrams = [...bigrams.map(gram => gram.join(' ')), ...trigrams.map(gram => gram.join(' '))];

        filters.nlp_analysis.tokens = combinedTokens;
        filters.nlp_analysis.cleanedTokens = cleanedTokens;
        filters.nlp_analysis.stems = stems;
        filters.nlp_analysis.lemmas = lemmas;
        filters.nlp_analysis.phonetics = phonetics;
        filters.nlp_analysis.ngrams = allNgrams;
        filters.nlp_analysis.entities = entities;
        filters.keywords = cleanedTokens;

        filters.nlp_analysis.lemmatized = stems;

        console.log(`   🔤 Extracted ${combinedTokens.length} total tokens (${cleanedTokens.length} after cleanup)`);
        console.log(`   📊 Analysis: ${stems.length} stems, ${lemmas.length} lemmas, ${phonetics.length} phonetics, ${allNgrams.length} n-grams`);
    }

    extractGender(queryLower, filters) {

        let genderMatches = [];

        for (const [gender, genderData] of Object.entries(this.genderHierarchy)) {

            if (genderData.direct) {
                for (const indicator of genderData.direct) {
                    if (queryLower.includes(indicator.toLowerCase())) {
                        genderMatches.push({
                            gender,
                            indicator,
                            score: indicator.length * 10,
                            matchType: 'direct'
                        });
                    }
                }
            }

            if (genderData.contextual) {
                for (const indicator of genderData.contextual) {
                    if (queryLower.includes(indicator.toLowerCase())) {
                        genderMatches.push({
                            gender,
                            indicator,
                            score: indicator.length * 15,
                            matchType: 'contextual'
                        });
                    }
                }
            }

            if (genderData.patterns) {
                for (const pattern of genderData.patterns) {
                    if (pattern.test(queryLower)) {
                        genderMatches.push({
                            gender,
                            indicator: pattern.toString(),
                            score: 100,
                            matchType: 'pattern'
                        });
                    }
                }
            }
        }

        if (genderMatches.length > 0) {

            genderMatches.sort((a, b) => b.score - a.score);
            const bestGenderMatch = genderMatches[0];

            filters.gender = bestGenderMatch.gender;
            filters.nlp_analysis.genderDetected = bestGenderMatch.gender;

        } else {
            filters.gender = null;
        }
    }

    extractCategories(queryLower, filters) {
        console.log(`🔍 Category and Subcategory Detection...`);

        const subcategoryMatches = [];
        const categoryMatches = [];

        console.log(`🧠 Smart inference phase...`);

        if (queryLower.includes('smartwatch') || queryLower.includes('smart watch')) {
            subcategoryMatches.push({
                subcategory: 'smartwatches',
                synonym: 'smartwatch',
                score: 120,
                matchType: 'smart_inference'
            });
            console.log(`🎯 Smart inference: smartwatch detected`);
        } else if (queryLower.includes('watch') && !queryLower.includes('movie') && !queryLower.includes('video')) {
            subcategoryMatches.push({
                subcategory: 'smartwatches',
                synonym: 'watch',
                score: 110,
                matchType: 'smart_inference'
            });
            console.log(`🎯 Smart inference: watch -> smartwatch`);
        }

        if (queryLower.includes('mens t') || queryLower.includes('men t') ||
            queryLower.includes('t-shirt') || queryLower.includes('tshirt')) {
            subcategoryMatches.push({
                subcategory: 'tshirts',
                synonym: 't-shirt',
                score: 120,
                matchType: 'smart_inference'
            });
            console.log(`🎯 Smart inference: t-shirt detected`);
        }

        if (queryLower.includes('shoe') || queryLower.includes('sneaker') ||
            queryLower.includes('boot') || queryLower.includes('sandal')) {
            subcategoryMatches.push({
                subcategory: 'sneakers',
                synonym: 'shoes',
                score: 120,
                matchType: 'smart_inference'
            });
            console.log(`🎯 Smart inference: footwear detected`);
        }

        if (queryLower.includes('phone') || queryLower.includes('mobile') || queryLower.includes('smartphone')) {
            subcategoryMatches.push({
                subcategory: 'smartphones',
                synonym: 'phone',
                score: 120,
                matchType: 'smart_inference'
            });
            console.log(`🎯 Smart inference: phone detected`);
        }

        for (const [category, categoryData] of Object.entries(this.categoryHierarchy)) {
            if (categoryData.subcategories) {
                for (const [subcategory, subcatData] of Object.entries(categoryData.subcategories)) {

                    if (subcatData.synonyms) {
                        for (const synonym of subcatData.synonyms) {
                            const synonymLower = synonym.toLowerCase();
                            if (queryLower.includes(synonymLower)) {
                                let score = this.hierarchyWeights.exactMatch;
                                if (synonymLower.length > 8) score += 50;
                                subcategoryMatches.push({
                                    subcategory,
                                    category,
                                    synonym,
                                    score,
                                    matchType: 'exact_synonym'
                                });
                            }
                        }
                    }

                    if (subcatData.stems && filters.nlp_analysis.stems) {
                        for (const stem of subcatData.stems) {
                            if (filters.nlp_analysis.stems.includes(stem)) {
                                subcategoryMatches.push({
                                    subcategory,
                                    category,
                                    synonym: stem,
                                    score: this.hierarchyWeights.stemMatch,
                                    matchType: 'stem_match'
                                });
                            }
                        }
                    }

                    if (subcatData.phonetic && filters.nlp_analysis.phonetics) {
                        for (const phonetic of subcatData.phonetic) {
                            if (filters.nlp_analysis.phonetics.includes(phonetic)) {
                                subcategoryMatches.push({
                                    subcategory,
                                    category,
                                    synonym: phonetic,
                                    score: this.hierarchyWeights.phoneticMatch,
                                    matchType: 'phonetic_match'
                                });
                            }
                        }
                    }

                    if (subcatData.contextual) {
                        for (const context of subcatData.contextual) {
                            if (queryLower.includes(context.toLowerCase())) {
                                subcategoryMatches.push({
                                    subcategory,
                                    category,
                                    synonym: context,
                                    score: this.hierarchyWeights.contextualMatch,
                                    matchType: 'contextual'
                                });
                            }
                        }
                    }

                    for (const token of filters.nlp_analysis.cleanedTokens) {
                        if (subcatData.synonyms) {
                            for (const synonym of subcatData.synonyms) {
                                const similarity = stringSimilarity.compareTwoStrings(token.toLowerCase(), synonym.toLowerCase());
                                if (similarity > 0.85) {
                                    subcategoryMatches.push({
                                        subcategory,
                                        category,
                                        synonym,
                                        score: Math.floor(similarity * this.hierarchyWeights.fuzzyMatch),
                                        matchType: 'fuzzy_token',
                                        similarity: similarity
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const [category, categoryData] of Object.entries(this.categoryHierarchy)) {

            if (categoryData.synonyms) {
                for (const synonym of categoryData.synonyms) {
                    const synonymLower = synonym.toLowerCase();
                    if (queryLower.includes(synonymLower)) {
                        categoryMatches.push({
                            category,
                            synonym,
                            score: this.hierarchyWeights.categoryExact,
                            matchType: 'exact_category'
                        });
                    }
                }
            }

            if (categoryData.stems && filters.nlp_analysis.stems) {
                for (const stem of categoryData.stems) {
                    if (filters.nlp_analysis.stems.includes(stem)) {
                        categoryMatches.push({
                            category,
                            synonym: stem,
                            score: this.hierarchyWeights.stemMatch,
                            matchType: 'category_stem'
                        });
                    }
                }
            }

            if (categoryData.phonetic && filters.nlp_analysis.phonetics) {
                for (const phonetic of categoryData.phonetic) {
                    if (filters.nlp_analysis.phonetics.includes(phonetic)) {
                        categoryMatches.push({
                            category,
                            synonym: phonetic,
                            score: this.hierarchyWeights.phoneticMatch,
                            matchType: 'category_phonetic'
                        });
                    }
                }
            }

            for (const token of filters.nlp_analysis.cleanedTokens) {
                if (categoryData.synonyms) {
                    for (const synonym of categoryData.synonyms) {
                        const similarity = stringSimilarity.compareTwoStrings(token.toLowerCase(), synonym.toLowerCase());
                        if (similarity > 0.8) {
                            categoryMatches.push({
                                category,
                                synonym,
                                score: Math.floor(similarity * this.hierarchyWeights.fuzzyMatch),
                                matchType: 'category_fuzzy',
                                similarity: similarity
                            });
                        }
                    }
                }
            }
        }

        if (subcategoryMatches.length > 0) {
            const bestSubcategoryMatch = subcategoryMatches
                .sort((a, b) => b.score - a.score)[0];

            console.log(`🎯 Best Subcategory: ${bestSubcategoryMatch.subcategory} (${bestSubcategoryMatch.matchType}, score: ${bestSubcategoryMatch.score})`);

            filters.subcategory = bestSubcategoryMatch.subcategory;
            filters.nlp_analysis.subcategoryDetected = bestSubcategoryMatch.subcategory;

            if (bestSubcategoryMatch.category) {
                filters.category = bestSubcategoryMatch.category;
            } else {

                for (const [categoryName, categoryData] of Object.entries(this.categoryHierarchy)) {
                    if (categoryData.subcategories && categoryData.subcategories[bestSubcategoryMatch.subcategory]) {
                        filters.category = categoryName;
                        console.log(`🔗 Dynamic category mapping: ${bestSubcategoryMatch.subcategory} → ${categoryName}`);
                        break;
                    }
                }
            }

            filters.nlp_analysis.categoryDetected = filters.category;

        } else if (categoryMatches.length > 0) {
            const bestCategoryMatch = categoryMatches
                .sort((a, b) => b.score - a.score)[0];

            filters.category = bestCategoryMatch.category;
            filters.nlp_analysis.categoryDetected = bestCategoryMatch.category;
        } else {
            console.log(`❌ No category/subcategory detected with enhanced NLP analysis`);
        }

        console.log(`📱 Final Category Analysis: Category=${filters.category}, Subcategory=${filters.subcategory}`);
    }

    extractBrands(queryLower, filters) {
        console.log(`🏷️ Brand Detection...`);

        for (const [brand, variants] of Object.entries(this.brands)) {
            for (const variant of variants) {
                if (queryLower.includes(variant.toLowerCase())) {
                    filters.brand = brand;
                    filters.nlp_analysis.brandDetected = brand;
                    console.log(`🏷️ Brand detected: ${brand} (via "${variant}")`);
                    return;
                }
            }
        }
    }

    extractColors(queryLower, filters) {
        for (const [color, variants] of Object.entries(this.colors)) {
            for (const variant of variants) {
                if (queryLower.includes(variant.toLowerCase())) {
                    filters.color = color;
                    filters.nlp_analysis.colorDetected = color;
                    console.log(`🎨 Color detected: ${color}`);
                    return;
                }
            }
        }
    }

    extractPriceInformation(queryLower, filters) {
        const numbers = queryLower.match(/\d+/g);
        if (!numbers) return;

        
        const priceNumbers = numbers.map(n => parseInt(n)).filter(n => n >= 1 && n <= 1000000);
        
        console.log(`💰 Detected price numbers:`, priceNumbers);

       
        const rangePatterns = [
            /(?:over|above)\s*(\d+).*?(?:and|but).*?(?:less than|under|below)\s*(\d+)/i,
            /between\s*(\d+).*?(?:and|to)\s*(\d+)/i,
            /from\s*(\d+).*?(?:to|-)\s*(\d+)/i,
            /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:range|price)/i
        ];

        let rangeDetected = false;
        
        for (const pattern of rangePatterns) {
            const match = queryLower.match(pattern);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                
                if (min && max && min < max && min >= 1 && max <= 1000000) {
                    filters.price_min = min;
                    filters.price_max = max;
                    console.log(`💰 Price range detected: ${min} - ${max}`);
                    rangeDetected = true;
                    break;
                }
            }
        }


        if (!rangeDetected) {
            for (const num of priceNumbers) {
                for (const indicator of this.priceIndicators.max) {
                    if (queryLower.includes(indicator)) {
                        filters.price_max = num;
                        console.log(`💰 Max price: ${num}`);
                        break;
                    }
                }

                for (const indicator of this.priceIndicators.min) {
                    if (queryLower.includes(indicator)) {
                        filters.price_min = num;
                        console.log(`💰 Min price: ${num}`);
                        break;
                    }
                }
            }
        }
    }

    extractFeatures(queryLower, filters) {
        console.log(`🔧 Advanced Feature Detection...`);

        if (!filters.nlp_analysis.extractedFeatures) {
            filters.nlp_analysis.extractedFeatures = {};
        }

        for (const [featureType, keywords] of Object.entries(this.featureKeywords)) {
            if (featureType === 'processors') {

                for (const [processorType, processorKeywords] of Object.entries(keywords)) {
                    for (const keyword of processorKeywords) {
                        if (queryLower.includes(keyword.toLowerCase())) {
                            filters.features.push(`${processorType}_processor`);

                            if (processorType !== 'generic') {
                                filters.specifications.processor = processorType;
                                console.log(`🔧 Processor detected: ${processorType} (${keyword})`);

                                if (!filters.nlp_analysis.extractedFeatures.processorBrands) {
                                    filters.nlp_analysis.extractedFeatures.processorBrands = { exclude: [] };
                                }

                                if (this.featureKeywords.brands?.exclusions?.[processorType]) {
                                    filters.nlp_analysis.extractedFeatures.processorBrands.exclude =
                                        filters.nlp_analysis.extractedFeatures.processorBrands.exclude.concat(
                                            this.featureKeywords.brands.exclusions[processorType]
                                        );
                                    console.log(`🚫 Processor exclusions added for ${processorType}:`, this.featureKeywords.brands.exclusions[processorType]);
                                }
                            } else {

                                if (!filters.specifications.processor) {
                                    filters.specifications.processor = processorType;
                                    console.log(`🔧 Generic processor detected: ${keyword}`);
                                }
                            }
                        }
                    }
                }
            } else if (featureType === 'brands') {

                for (const [brandType, brandKeywords] of Object.entries(keywords)) {
                    if (brandType !== 'exclusions') {
                        for (const keyword of brandKeywords) {
                            if (queryLower.includes(keyword.toLowerCase())) {
                                filters.specifications.brand_type = brandType;
                                console.log(`🏷️ Brand type detected: ${brandType} (${keyword})`);

                                if (!filters.nlp_analysis.extractedFeatures.brands) {
                                    filters.nlp_analysis.extractedFeatures.brands = { include: [], exclude: [] };
                                }

                                filters.nlp_analysis.extractedFeatures.brands.include =
                                    filters.nlp_analysis.extractedFeatures.brands.include.concat(brandKeywords);
                            }
                        }
                    }
                }
            } else if (Array.isArray(keywords)) {

                for (const keyword of keywords) {
                    if (queryLower.includes(keyword.toLowerCase())) {
                        filters.features.push(keyword);
                        console.log(`⚡ Feature detected: ${keyword}`);
                    }
                }
            }
        }

        if (filters.nlp_analysis.extractedFeatures.processorBrands?.exclude) {
            filters.nlp_analysis.extractedFeatures.processorBrands.exclude =
                [...new Set(filters.nlp_analysis.extractedFeatures.processorBrands.exclude)];
        }
        if (filters.nlp_analysis.extractedFeatures.brands?.include) {
            filters.nlp_analysis.extractedFeatures.brands.include =
                [...new Set(filters.nlp_analysis.extractedFeatures.brands.include)];
        }

        filters.features = [...new Set(filters.features)];

        console.log(`✅ Extracted features structure:`, filters.nlp_analysis.extractedFeatures);
    }

    determineIntent(filters) {
        if (filters.price_max || filters.price_min) {
            filters.intent = 'price-focused';
        } else if (filters.features.length > 0) {
            filters.intent = 'feature-focused';
        } else if (filters.brand) {
            filters.intent = 'brand-focused';
        } else if (filters.category) {
            filters.intent = 'category-focused';
        } else {
            filters.intent = 'general';
        }

        console.log(`🎯 Intent: ${filters.intent}`);
    }

    generateSearchTerms(queryLower, filters) {
        console.log(`🔍 Enhanced Search Term Generation using Full NLP Analysis...`);

        const searchTerms = new Set();

        if (filters.nlp_analysis.cleanedTokens) {
            filters.nlp_analysis.cleanedTokens.forEach(token => {
                if (token.length > 2) searchTerms.add(token);
            });
        }

        if (filters.category) searchTerms.add(filters.category);
        if (filters.subcategory) searchTerms.add(filters.subcategory);
        if (filters.brand) searchTerms.add(filters.brand);
        if (filters.color) searchTerms.add(filters.color);
        if (filters.gender) searchTerms.add(filters.gender);

        if (filters.nlp_analysis.stems) {
            filters.nlp_analysis.stems.forEach(stem => {

                if (stem.length > 2 && !stem.includes('ees') && !stem.includes('ss')) {
                    searchTerms.add(stem);
                }
            });
        }

        if (filters.nlp_analysis.lemmas) {
            filters.nlp_analysis.lemmas.forEach(lemma => {
                if (lemma.length > 2) searchTerms.add(lemma);
            });
        }

        if (filters.nlp_analysis.ngrams) {
            filters.nlp_analysis.ngrams.slice(0, 5).forEach(ngram => {
                if (ngram.length > 3) searchTerms.add(ngram);
            });
        }

        if (filters.features) {
            filters.features.forEach(feature => searchTerms.add(feature));
        }

        if (filters.nlp_analysis.tokens) {
            filters.nlp_analysis.tokens.forEach(token => {
                if (token.length > 2) searchTerms.add(token);
            });
        }

        const searchTermsArray = Array.from(searchTerms);

        const prioritizedTerms = [];

        [filters.category, filters.subcategory, filters.brand, filters.gender].forEach(term => {
            if (term && !prioritizedTerms.includes(term)) prioritizedTerms.push(term);
        });

        if (filters.nlp_analysis.cleanedTokens) {
            filters.nlp_analysis.cleanedTokens.forEach(token => {
                if (token.length > 2 && !prioritizedTerms.includes(token)) {
                    prioritizedTerms.push(token);
                }
            });
        }

        searchTermsArray.forEach(term => {
            if (!prioritizedTerms.includes(term) && prioritizedTerms.length < 25) {
                prioritizedTerms.push(term);
            }
        });

        filters.searchTerms = prioritizedTerms.slice(0, 20);

        console.log(`   🎯 Generated ${filters.searchTerms.length} prioritized search terms`);
        console.log(`   🔤 Top terms: ${filters.searchTerms.slice(0, 8).join(', ')}`);
    }

    getEmptyFilters() {
        return {
            category: null,
            subcategory: null,
            brand: null,
            color: null,
            price_max: null,
            price_min: null,
            gender: null,
            rating_min: null,
            features: [],
            keywords: [],
            tokens: [],
            specifications: {},
            intent: 'general',
            searchTerms: [],
            nlp_analysis: {
                tokens: [],
                entities: [],
                lemmatized: [],
                corrected_query: '',
                confidence: 0,
                detectedFeatures: [],
                priceRange: {},
                colorDetected: null,
                brandDetected: null,
                categoryDetected: null,
                subcategoryDetected: null,
                genderDetected: null
            }
        };
    }

    analyzeQuery(query) {
        const analysis = this.parseQueryWithNLP(query);
        return {
            keywords: analysis.keywords || [],
            categories: analysis.category ? [analysis.category] : [],
            brands: analysis.brand ? [analysis.brand] : [],
            sentiment: { score: 0.5 },
            intent: analysis.intent || 'general',
            filters: analysis
        };
    }
}

module.exports = {
    parseQueryWithNLP: function(query) {
        const service = new ImprovedNLPService();
        return service.parseQueryWithNLP(query);
    },
    analyzeQuery: function(query) {
        const service = new ImprovedNLPService();
        return service.analyzeQuery(query);
    }
};