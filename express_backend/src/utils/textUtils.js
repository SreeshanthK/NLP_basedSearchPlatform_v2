const stringSimilarity = require('string-similarity');

function preprocessQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }
    let processed = query.toLowerCase().trim();

    const corrections = {
        'smart phones': 'smartphones',
        'smart phone': 'smartphone',
        'smartfones': 'smartphones',
        'smartfone': 'smartphone',
        'smrtphones': 'smartphones',
        'cell phones': 'mobile phones',
        'cell phone': 'mobile phone',
        'mobiles': 'mobile phones',
        'mobile': 'mobile phone',
        'mobil': 'mobile phone',
        'mobiel': 'mobile phone',
        'moble': 'mobile phone',
        'celphones': 'mobile phones',
        'i phone': 'iphone',
        'i-phone': 'iphone',
        'ifone': 'iphone',
        'iphones': 'iphone',
        'i pad': 'ipad',
        'i-pad': 'ipad',
        'iapd': 'ipad',
        'lap top': 'laptop',
        'lap-top': 'laptop',
        'lap tops': 'laptops',
        'leptop': 'laptop',
        'leptops': 'laptops',
        'ear buds': 'earbuds',
        'ear-buds': 'earbuds',
        'earbuds': 'earbuds',
        'ear phones': 'earphones',
        'ear-phones': 'earphones',
        'earfones': 'earphones',
        'head phones': 'headphones',
        'head-phones': 'headphones',
        'headfones': 'headphones',
        'smart watch': 'smartwatch',
        'smart-watch': 'smartwatch',
        'smart watches': 'smartwatches',
        'smartwach': 'smartwatch',

        'boat': 'boAt',
        'bOat': 'boAt',
        'BOAT': 'boAt',
        'mi phone': 'xiaomi',
        'mi mobile': 'xiaomi',
        'redmi': 'xiaomi',
        'poco': 'xiaomi',
        'one plus': 'oneplus',
        'one-plus': 'oneplus',
        '1+': 'oneplus',
        '1 plus': 'oneplus',
        'sam sung': 'samsung',
        'sam-sung': 'samsung',
        'samsumg': 'samsung',
        'samsung': 'samsung',
        'apple phone': 'iphone',
        'google phone': 'pixel',
        'google pixel': 'pixel',
        'realmi': 'realme',
        'oppo': 'oppo',
        'vivo': 'vivo',
        'nokia': 'nokia',
        'motorola': 'motorola',
        'moto': 'motorola',

        'running shoes': 'sneakers',
        'sports shoes': 'sneakers',
        'athletic shoes': 'sneakers',
        'gym shoes': 'sneakers',
        'training shoes': 'sneakers',
        'tennis shoes': 'sneakers',
        'basket ball shoes': 'basketball shoes',
        'basket-ball shoes': 'basketball shoes',
        'foot wear': 'footwear',
        'foot-wear': 'footwear',
        'sneekers': 'sneakers',
        'sneeker': 'sneakers',
        'snickers': 'sneakers',
        'sniker': 'sneakers',

        'good quality': 'high rating',
        'best quality': 'high rating',
        'top rated': 'high rating',
        'highly rated': 'high rating',
        'top quality': 'high rating',
        'gud quality': 'high rating',
        'best': 'high rating',
        'top': 'high rating',

        'under rs': 'under',
        'below rs': 'below',
        'above rs': 'above',
        'over rs': 'over',
        'less than rs': 'less than',
        'more than rs': 'more than',
        'within rs': 'within',
        'budget rs': 'budget',
        'price range': 'price',
        'cost': 'price',
        'rupees': 'rs',
        'rupee': 'rs'
    };

    for (const [wrong, correct] of Object.entries(corrections)) {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        processed = processed.replace(regex, correct);
    }

    processed = processed.replace(/(\d+)k\b/gi, (match, num) => `${num}000`);
    processed = processed.replace(/(\d+)K\b/g, (match, num) => `${num}000`);

    processed = processed.replace(/(\d+(?:\.\d+)?)\s*star[s]?\s*above/gi, '$1+ rating');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*star[s]?\s*and\s*above/gi, '$1+ rating');
    processed = processed.replace(/above\s*(\d+(?:\.\d+)?)\s*star[s]?/gi, '$1+ rating');
    processed = processed.replace(/(\d+(?:\.\d+)?)\+\s*star[s]?/gi, '$1+ rating');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*star[s]?\s*or\s*above/gi, '$1+ rating');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*star[s]?\s*plus/gi, '$1+ rating');
    processed = processed.replace(/minimum\s*(\d+(?:\.\d+)?)\s*star[s]?/gi, '$1+ rating');
    processed = processed.replace(/min\s*(\d+(?:\.\d+)?)\s*star[s]?/gi, '$1+ rating');
    processed = processed.replace(/\b(\d+(?:\.\d+)?)\s*star[s]?\b/gi, '$1+ rating');

    const keyTerms = {
        'smartphone': ['smartfone', 'smrtphone', 'smartphon'],
        'earbuds': ['earbuds', 'earbud', 'earbusd'],
        'headphones': ['headfones', 'headphons', 'hedphones'],
        'sneakers': ['sneekers', 'sneeker', 'snickers'],
        'laptop': ['leptop', 'laptap', 'labtop']
    };

    for (const [correct, typos] of Object.entries(keyTerms)) {
        for (const typo of typos) {
            if (processed.includes(typo)) {
                processed = processed.replace(new RegExp(typo, 'gi'), correct);
            }
        }
    }

    return processed;
}

function calculateCharSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) {
            matches++;
        }
    }

    return matches / maxLength;
}

function fuzzyMatchCategory(queryTerm, categories) {
    const matches = [];
    const threshold = 0.5;

    for (const [category, variants] of Object.entries(categories)) {
        for (const variant of variants) {

            if (queryTerm.includes(variant) || variant.includes(queryTerm)) {
                const score = Math.max(queryTerm.length, variant.length) > 0 ?
                    Math.min(queryTerm.length, variant.length) / Math.max(queryTerm.length, variant.length) : 0;
                matches.push({ category, variant, score: 0.85 + (score * 0.1), type: 'semantic' });
                continue;
            }

            const similarity = stringSimilarity.compareTwoStrings(queryTerm, variant);
            if (similarity >= threshold) {
                matches.push({ category, variant, score: similarity, type: 'similarity' });
            }

            const charSimilarity = calculateCharSimilarity(queryTerm, variant);
            if (charSimilarity >= threshold) {
                matches.push({ category, variant, score: charSimilarity * 0.8, type: 'char-similarity' });
            }
        }
    }

    const uniqueMatches = new Map();
    for (const match of matches) {
        const key = `${match.category}-${match.variant}`;
        if (!uniqueMatches.has(key) || uniqueMatches.get(key).score < match.score) {
            uniqueMatches.set(key, match);
        }
    }

    const sortedMatches = Array.from(uniqueMatches.values()).sort((a, b) => b.score - a.score);

    return sortedMatches;
}

module.exports = {
    preprocessQuery,
    calculateCharSimilarity,
    fuzzyMatchCategory
};