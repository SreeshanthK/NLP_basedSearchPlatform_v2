const stringSimilarity = require('string-similarity');
const { calculateCharSimilarity } = require('./textUtils');

function fuzzyMatchBrand(queryTerm, brands) {
    const matches = [];
    const threshold = 0.6; 
    
    for (const [brand, variants] of Object.entries(brands)) {
        for (const variant of variants) {
            if (queryTerm === variant) {
                matches.push({ brand, variant, score: 1.0, type: 'exact' });
                continue;
            }
            
            if (queryTerm.toLowerCase() === variant.toLowerCase()) {
                matches.push({ brand, variant, score: 0.98, type: 'case-insensitive' });
                continue;
            }
            
            if (queryTerm.includes(variant) || variant.includes(queryTerm)) {
                let score = 0.9;
                if (queryTerm.startsWith(variant) || variant.startsWith(queryTerm)) {
                    score = 0.95;
                }
                matches.push({ brand, variant, score, type: 'substring' });
                continue;
            }
            
            const similarity = stringSimilarity.compareTwoStrings(queryTerm, variant);
            if (similarity >= threshold) {
                matches.push({ brand, variant, score: similarity, type: 'similarity' });
            }
            
            const charSimilarity = calculateCharSimilarity(queryTerm, variant);
            if (charSimilarity >= 0.5) {
                matches.push({ brand, variant, score: charSimilarity * 0.8, type: 'char-similarity' });
            }
            
            const abbreviations = {
                'lg': ['lg', 'life good'],
                'hp': ['hp', 'hewlett packard'],
                'mi': ['mi', 'xiaomi'],
                'nb': ['nb', 'new balance'],
                'ua': ['ua', 'under armour']
            };
            
            if (abbreviations[queryTerm] && abbreviations[queryTerm].includes(variant)) {
                matches.push({ brand, variant, score: 0.95, type: 'abbreviation' });
            }
            
            const commonWords = ['stars', 'star', 'rating', 'above', 'below', 'under', 'over', 'quality', 'good', 'best', 'top'];
            const queryWords = queryTerm.split(' ');
            const variantWords = variant.split(' ');
            
            for (const qWord of queryWords) {
                if (commonWords.includes(qWord.toLowerCase())) {
                    continue;
                }
                
                for (const vWord of variantWords) {
                    if (qWord.length > 2 && vWord.length > 2) {
                        const wordSimilarity = stringSimilarity.compareTwoStrings(qWord, vWord);
                        if (wordSimilarity >= 0.8) {
                            matches.push({ 
                                brand, 
                                variant, 
                                score: wordSimilarity * 0.85, 
                                type: 'word-match' 
                            });
                        }
                    }
                }
            }
        }
    }
    
    const uniqueMatches = new Map();
    for (const match of matches) {
        const key = `${match.brand}-${match.variant}`;
        if (!uniqueMatches.has(key) || uniqueMatches.get(key).score < match.score) {
            uniqueMatches.set(key, match);
        }
    }
    
    const sortedMatches = Array.from(uniqueMatches.values()).sort((a, b) => b.score - a.score);
    
    return sortedMatches;
}

module.exports = {
    fuzzyMatchBrand
};
