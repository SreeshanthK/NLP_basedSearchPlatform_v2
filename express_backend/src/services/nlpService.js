const { getNLPInstance } = require('../config/nlp');
const { preprocessQuery } = require('../utils/textUtils');

function parseQueryIntelligently(query) {
    if (!query || typeof query !== 'string') {
        return {
            rating_min: null,
            price_max: null,
            price_min: null,
            features: [],
            attributes: {},
            intent: 'general'
        };
    }
    
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);
    
    const filters = {
        rating_min: null,
        price_max: null,
        price_min: null,
        features: [],
        attributes: {},
        intent: 'general'
    };
    
    const numbers = [];
    const numberPattern = /\b\d+(?:,\d+)*(?:k|K)?\b/g;
    let match;
    while ((match = numberPattern.exec(query)) !== null) {
        let num = match[0].replace(/,/g, '');
        if (num.toLowerCase().endsWith('k')) {
            num = parseFloat(num.slice(0, -1)) * 1000;
        } else {
            num = parseFloat(num);
        }
        if (!isNaN(num)) {
            numbers.push({
                value: num,
                position: match.index,
                original: match[0],
                context: query.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10)
            });
        }
    }
    
    const priceKeywords = {
        max: ['under', 'below', 'less than', 'max', 'maximum', 'budget', 'within', 'up to', 'not more than', 'limit'],
        min: ['over', 'above', 'more than', 'min', 'minimum', 'starting', 'at least', 'from'],
        range: ['between', 'to', 'range', '-']
    };
    
    const ratingKeywords = ['star', 'stars', 'rating', 'rated'];
    
    for (const number of numbers) {
        const beforeContext = query.substring(0, number.position).toLowerCase();
        const afterContext = query.substring(number.position + number.original.length).toLowerCase();
        const fullContext = (beforeContext + ' ' + afterContext).toLowerCase();
        
        const isRating = ratingKeywords.some(keyword => 
            beforeContext.includes(keyword) || afterContext.includes(keyword) || 
            number.context.toLowerCase().includes(keyword)
        ) && number.value <= 5; 
        
        if (isRating) {
            filters.rating_min = number.value;
            continue;
        }
        
        const isPriceRelated = number.value >= 100; 
        
        if (isPriceRelated) {
            let priceType = null;
            
            for (const keyword of priceKeywords.max) {
                if (beforeContext.includes(keyword)) {
                    priceType = 'max';
                    break;
                }
            }
            
            if (!priceType) {
                for (const keyword of priceKeywords.min) {
                    if (beforeContext.includes(keyword)) {
                        priceType = 'min';
                        break;
                    }
                }
            }
            
            if (!priceType) {
                priceType = 'max';
            }
            
            if (priceType === 'max') {
                filters.price_max = number.value;
            } else if (priceType === 'min') {
                filters.price_min = number.value;
            }
        }
    }
    
    const featureKeywords = {
        charging: ['fast charging', 'wireless charging', 'quick charge', 'rapid charge'],
        display: ['amoled', 'oled', 'lcd', 'retina', 'hd', 'full hd', '4k'],
        connectivity: ['5g', '4g', 'wifi', 'bluetooth', 'nfc'],
        storage: ['storage', 'memory', 'ram', 'gb', 'tb'],
        camera: ['camera', 'megapixel', 'mp', 'selfie', 'front camera', 'rear camera'],
        audio: ['noise cancelling', 'bass', 'stereo', 'surround'],
        design: ['waterproof', 'water resistant', 'durable', 'lightweight'],
        performance: ['gaming', 'processor', 'chipset', 'performance']
    };
    
    for (const [category, keywords] of Object.entries(featureKeywords)) {
        for (const keyword of keywords) {
            if (queryLower.includes(keyword)) {
                filters.features.push(keyword);
                filters.attributes[category] = filters.attributes[category] || [];
                filters.attributes[category].push(keyword);
            }
        }
    }
    
    if (filters.price_max || filters.price_min) {
        filters.intent = 'price-focused';
    } else if (filters.features.length > 0) {
        filters.intent = 'feature-focused';
    } else if (filters.rating_min) {
        filters.intent = 'quality-focused';
    }
    
    return filters;
}

function parseQueryWithNLP(query) {
    if (!query || typeof query !== 'string') {
        return {
            category: null,
            brand: null,
            color: null,
            price_max: null,
            price_min: null,
            gender: null,
            rating_min: null,
            features: [],
            keywords: [],
            intent: 'general'
        };
    }

    const winkNlp = getNLPInstance();
    const processedQuery = preprocessQuery(query);
    const queryLower = processedQuery.toLowerCase();
    
    const filters = {
        category: null,
        brand: null,
        color: null,
        price_max: null,
        price_min: null,
        gender: null,
        rating_min: null,
        features: [],
        keywords: [],
        intent: 'general'
    };

    const brandEntities = {
        "nike": ["nike", "nike air"],
        "adidas": ["adidas", "originals"],
        "puma": ["puma"],
        "reebok": ["reebok"],
        "converse": ["converse"],
        "vans": ["vans"],
        "new balance": ["new balance", "nb"],
        "skechers": ["skechers"],
        "fila": ["fila"],
        "apple": ["apple", "iphone", "ipad"],
        "samsung": ["samsung", "galaxy"],
        "google": ["google", "pixel"],
        "oneplus": ["oneplus", "one plus"],
        "xiaomi": ["xiaomi", "mi", "redmi"],
        "oppo": ["oppo"],
        "vivo": ["vivo"],
        "realme": ["realme"],
        "motorola": ["motorola", "moto"],
        "nokia": ["nokia"],
        "boat": ["boat", "boAt"]
    };

    const colorEntities = {
        "black": ["black", "dark"],
        "white": ["white", "cream"],
        "red": ["red"],
        "blue": ["blue", "navy"],
        "green": ["green"],
        "yellow": ["yellow", "gold"],
        "pink": ["pink"],
        "purple": ["purple"],
        "brown": ["brown", "tan"],
        "grey": ["grey", "gray", "silver"],
        "orange": ["orange"]
    };

    const categoryEntities = {
        "clothing": ["shirt", "t-shirt", "t shirt", "tshirt", "polo", "blouse", "top", "dress", "pant", "pants", "jean", "jeans", "trouser", "short", "shorts", "jacket", "coat", "hoodie", "sweatshirt", "sweater", "skirt", "clothing", "clothes", "apparel", "wear"],
        "footwear": ["shoes", "footwear", "sneakers", "boots", "sandals", "heels", "flats", "running shoes", "athletic shoes", "shoe", "sneaker"],
        "mobile phones": ["smartphone", "phone", "mobile", "iphone", "android", "cell phone", "cellular"],
        "laptops": ["laptop", "notebook", "computer", "pc"],
        "headphones": ["headphones", "earbuds", "earphones", "audio"],
        "tablets": ["tablet", "ipad"],
        "smartwatches": ["smartwatch", "watch", "wearable"]
    };

    const featureKeywords = {
        charging: ["fast charging", "wireless charging", "quick charge", "rapid charge"],
        display: ["amoled", "oled", "lcd", "retina", "hd", "full hd", "4k"],
        connectivity: ["5g", "4g", "wifi", "bluetooth", "nfc"],
        storage: ["storage", "memory", "ram", "gb", "tb"],
        camera: ["camera", "megapixel", "mp", "selfie", "front camera", "rear camera"],
        audio: ["noise cancelling", "bass", "stereo", "surround"],
        design: ["waterproof", "water resistant", "durable", "lightweight"],
        performance: ["gaming", "processor", "chipset", "performance"]
    };

    if (winkNlp) {
        try {
            const doc = winkNlp.readDoc(query);
            const tokens = doc.tokens().out();
            const raw = query.toLowerCase();
            
            let foundNumbers = [];
            tokens.forEach((token, idx) => {
                if (/^\d+(k|K)?$/.test(token)) {
                    let price = token.toLowerCase().endsWith('k') ? parseInt(token) * 1000 : parseInt(token);
                    
                    let prevToken = idx > 0 ? tokens[idx - 1].toLowerCase() : '';
                    let prevToken2 = idx > 1 ? tokens[idx - 2].toLowerCase() : '';
                    let nextToken = idx < tokens.length - 1 ? tokens[idx + 1].toLowerCase() : '';
                    
                    foundNumbers.push({
                        value: price,
                        prevToken,
                        prevToken2,
                        nextToken,
                        context: `${prevToken2} ${prevToken} ${token} ${nextToken}`.trim()
                    });
                }
            });

            for (const num of foundNumbers) {
                const priceMaxWords = ["under", "below", "less", "max", "within", "upto", "up", "budget"];
                const priceMinWords = ["over", "above", "more", "min", "minimum", "from", "starting", "at"];
                const ratingWords = ["star", "stars", "rating", "rated"];
                
                if (num.value <= 5 && (ratingWords.includes(num.prevToken) || ratingWords.includes(num.nextToken) || 
                    num.context.includes('star') || num.context.includes('rating'))) {
                    filters.rating_min = num.value;
                    continue;
                }
                
                if (num.value >= 100) { 
                    if (priceMaxWords.includes(num.prevToken) || priceMaxWords.includes(num.prevToken2)) {
                        filters.price_max = num.value;
                    } else if (priceMinWords.includes(num.prevToken) || priceMinWords.includes(num.prevToken2)) {
                        filters.price_min = num.value;
                    } else {
                        if (raw.includes('under') || raw.includes('below') || raw.includes('within')) {
                            filters.price_max = num.value;
                        }
                    }
                }
            }

            for (const [brand, variants] of Object.entries(brandEntities)) {
                for (const variant of variants) {
                    if (raw.includes(variant)) {
                        filters.brand = brand;
                        break;
                    }
                }
                if (filters.brand) break;
            }

            for (const [color, variants] of Object.entries(colorEntities)) {
                for (const variant of variants) {
                    if (raw.includes(variant)) {
                        filters.color = color;
                        break;
                    }
                }
                if (filters.color) break;
            }

            for (const [category, variants] of Object.entries(categoryEntities)) {
                for (const variant of variants) {
                    if (raw.includes(variant)) {
                        filters.category = category;
                        break;
                    }
                }
                if (filters.category) break;
            }

            for (const [featureType, keywords] of Object.entries(featureKeywords)) {
                for (const keyword of keywords) {
                    if (raw.includes(keyword)) {
                        filters.features.push(keyword);
                    }
                }
            }

            doc.tokens().each(token => {
                const pos = token.out('its.pos');
                const rawText = token.out().toLowerCase();
                
                if (["NOUN", "ADJ", "PROPN"].includes(pos) && rawText.length > 2) {
                    filters.keywords.push(rawText);
                }
            });

            const originalWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
            filters.keywords.push(...originalWords);
            
            filters.keywords = [...new Set(filters.keywords)];

        } catch (error) {
            filters.keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        }
    } else {
        filters.keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        
        const numbers = query.match(/\d+/g);
        if (numbers) {
            const largestNum = Math.max(...numbers.map(n => parseInt(n)));
            if (largestNum >= 100 && (query.includes('under') || query.includes('below'))) {
                filters.price_max = largestNum;
            }
        }
    }

    if (filters.price_max || filters.price_min) {
        filters.intent = 'price-focused';
    } else if (filters.features.length > 0) {
        filters.intent = 'feature-focused';
    } else if (filters.brand) {
        filters.intent = 'brand-focused';
    } else if (filters.category) {
        filters.intent = 'category-focused';
    }

    return filters;
}

function analyzeQuery(query) {
    const analysis = parseQueryWithNLP(query);
    return {
        keywords: analysis.keywords || [],
        categories: analysis.category ? [analysis.category] : [],
        brands: analysis.brand ? [analysis.brand] : [],
        sentiment: { score: 0.5 },
        intent: analysis.intent || 'general',
        filters: analysis
    };
}

module.exports = {
    parseQueryIntelligently,
    parseQueryWithNLP,
    analyzeQuery
};
