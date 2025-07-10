const SEMANTIC_MAPPINGS = {
    clothing: ['clothes', 'apparel', 'wear', 'garments', 'outfit', 'attire', 'fashion'],
    fashion: ['clothing', 'clothes', 'apparel', 'wear', 'style', 'garments'],
    apparel: ['clothing', 'clothes', 'wear', 'garments', 'fashion'],
    clothes: ['clothing', 'apparel', 'wear', 'garments', 'fashion'],
    wear: ['clothing', 'clothes', 'apparel', 'garments'],
    
    tshirts: ['t-shirts', 'tees', 'shirts', 'tops', 'clothing'],
    't-shirts': ['tshirts', 'tees', 'shirts', 'tops', 'clothing'],
    shirts: ['t-shirts', 'tshirts', 'tops', 'clothing', 'formal wear'],
    pants: ['trousers', 'jeans', 'bottoms', 'clothing'],
    jeans: ['pants', 'trousers', 'bottoms', 'clothing'],
    dress: ['dresses', 'gown', 'clothing', 'women wear'],
    dresses: ['dress', 'gown', 'clothing', 'women wear'],
    jacket: ['jackets', 'coat', 'outerwear', 'clothing'],
    jackets: ['jacket', 'coat', 'outerwear', 'clothing'],
    hoodie: ['hoodies', 'sweatshirt', 'clothing'],
    hoodies: ['hoodie', 'sweatshirt', 'clothing'],
    
    shoes: ['footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'],
    footwear: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats'],
    sneakers: ['shoes', 'trainers', 'athletic shoes', 'footwear'],
    boots: ['shoes', 'footwear'],
    sandals: ['shoes', 'footwear', 'flip-flops'],
    
    phone: ['smartphone', 'mobile', 'cell phone', 'device'],
    smartphone: ['phone', 'mobile', 'cell phone', 'device'],
    mobile: ['phone', 'smartphone', 'cell phone', 'device'],
    mobiles: ['phones', 'smartphones', 'mobile phones', 'devices'],
    laptop: ['computer', 'notebook', 'device'],
    computer: ['laptop', 'pc', 'device'],
    tablet: ['ipad', 'device'],
    device: ['phone', 'laptop', 'tablet', 'computer', 'gadget'],
    devices: ['phones', 'laptops', 'tablets', 'computers', 'gadgets'],
    
    sports: ['athletic', 'fitness', 'gym', 'exercise'],
    athletic: ['sports', 'fitness', 'gym', 'exercise'],
    fitness: ['sports', 'athletic', 'gym', 'exercise'],
    gym: ['sports', 'athletic', 'fitness', 'exercise'],
    
    running: ['jogging', 'athletic', 'sports'],
    gaming: ['games', 'video games', 'esports'],
    formal: ['business', 'professional', 'office'],
    casual: ['everyday', 'informal', 'relaxed']
};

const COLORS = [
    'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 
    'brown', 'gray', 'grey', 'silver', 'gold', 'beige', 'navy', 'maroon', 'teal',
    'turquoise', 'lime', 'olive', 'coral', 'salmon', 'indigo', 'violet', 'cyan',
    'magenta', 'crimson', 'aqua'
];

const CATEGORY_MAPPINGS = {
    'clothing': { priority: 'fashion', boost: 3.0 },
    'clothes': { priority: 'fashion', boost: 3.0 },
    'apparel': { priority: 'fashion', boost: 3.0 },
    'wear': { priority: 'fashion', boost: 2.5 },
    'tshirts': { priority: 'fashion', boost: 3.0 },
    't-shirts': { priority: 'fashion', boost: 3.0 },
    'shirts': { priority: 'fashion', boost: 3.0 },
    'pants': { priority: 'fashion', boost: 3.0 },
    'jeans': { priority: 'fashion', boost: 3.0 },
    'dress': { priority: 'fashion', boost: 3.0 },
    'dresses': { priority: 'fashion', boost: 3.0 },
    'jacket': { priority: 'fashion', boost: 3.0 },
    'jackets': { priority: 'fashion', boost: 3.0 },
    'hoodie': { priority: 'fashion', boost: 3.0 },
    'hoodies': { priority: 'fashion', boost: 3.0 },
    
    'shoes': { priority: 'footwear', boost: 3.0 },
    'footwear': { priority: 'footwear', boost: 3.0 },
    'sneakers': { priority: 'footwear', boost: 3.0 },
    'boots': { priority: 'footwear', boost: 3.0 },
    'sandals': { priority: 'footwear', boost: 3.0 },
    
    'phone': { priority: 'electronics', boost: 3.0 },
    'smartphone': { priority: 'electronics', boost: 3.0 },
    'mobile': { priority: 'electronics', boost: 3.0 },
    'mobiles': { priority: 'electronics', boost: 3.0 },
    'laptop': { priority: 'electronics', boost: 3.0 },
    'computer': { priority: 'electronics', boost: 3.0 },
    'tablet': { priority: 'electronics', boost: 3.0 },
    'device': { priority: 'electronics', boost: 2.0 },
    'devices': { priority: 'electronics', boost: 2.0 }
};

// Brand mappings for common brands
const BRAND_MAPPINGS = {
    'nike': { category: 'footwear', priority: 'high', alternatives: ['adidas', 'puma', 'reebok', 'converse'] },
    'adidas': { category: 'footwear', priority: 'high', alternatives: ['nike', 'puma', 'reebok', 'under armour'] },
    'puma': { category: 'footwear', priority: 'high', alternatives: ['nike', 'adidas', 'reebok', 'fila'] },
    'reebok': { category: 'footwear', priority: 'high', alternatives: ['nike', 'adidas', 'puma', 'new balance'] },
    'converse': { category: 'footwear', priority: 'high', alternatives: ['vans', 'nike', 'adidas'] },
    'vans': { category: 'footwear', priority: 'high', alternatives: ['converse', 'nike', 'adidas'] },
    
    'apple': { category: 'electronics', priority: 'high', alternatives: ['samsung', 'google', 'oneplus'] },
    'samsung': { category: 'electronics', priority: 'high', alternatives: ['apple', 'xiaomi', 'oneplus'] },
    'google': { category: 'electronics', priority: 'high', alternatives: ['apple', 'samsung', 'pixel'] },
    'oneplus': { category: 'electronics', priority: 'high', alternatives: ['samsung', 'xiaomi', 'realme'] },
    'xiaomi': { category: 'electronics', priority: 'high', alternatives: ['samsung', 'oneplus', 'realme'] },
    'iphone': { category: 'electronics', priority: 'high', alternatives: ['samsung galaxy', 'pixel', 'oneplus'] },
    
    'h&m': { category: 'fashion', priority: 'high', alternatives: ['zara', 'uniqlo', 'forever 21'] },
    'zara': { category: 'fashion', priority: 'high', alternatives: ['h&m', 'uniqlo', 'mango'] },
    'uniqlo': { category: 'fashion', priority: 'high', alternatives: ['h&m', 'zara', 'gap'] }
};

function analyzeSemanticIntent(query) {
    const words = query.toLowerCase().split(/\s+/);
    const analysis = {
        originalQuery: query,
        expandedTerms: new Set(),
        categoryPriorities: {},
        semanticBoosts: {},
        detectedIntents: [],
        detectedColor: null,
        isColorSearch: false
    };
    
    const detectedColors = words.filter(word => COLORS.includes(word));
    if (detectedColors.length > 0) {
        analysis.detectedColor = detectedColors[0];
        analysis.isColorSearch = true;
    }
    
    words.forEach(word => {
        if (SEMANTIC_MAPPINGS[word]) {
            SEMANTIC_MAPPINGS[word].forEach(synonym => {
                analysis.expandedTerms.add(synonym);
            });
        }
        
        if (CATEGORY_MAPPINGS[word]) {
            const mapping = CATEGORY_MAPPINGS[word];
            analysis.categoryPriorities[mapping.priority] = 
                Math.max(analysis.categoryPriorities[mapping.priority] || 0, mapping.boost);
            analysis.semanticBoosts[word] = mapping.boost;
        }
    });
    
    const queryLower = query.toLowerCase();
    
    if (queryLower.match(/\b(clothes|clothing|apparel|wear|tshirts|shirts|pants|jeans|dress|jacket|hoodie)\b/)) {
        analysis.detectedIntents.push('CLOTHING_SEARCH');
        analysis.categoryPriorities['fashion'] = Math.max(analysis.categoryPriorities['fashion'] || 0, 4.0);
        
        if (analysis.isColorSearch) {
            analysis.categoryPriorities['fashion'] = 5.0;
        }
    }
    
    if (queryLower.match(/\b(shoes|footwear|sneakers|boots|sandals|heels|flats)\b/)) {
        analysis.detectedIntents.push('FOOTWEAR_SEARCH');
        analysis.categoryPriorities['footwear'] = Math.max(analysis.categoryPriorities['footwear'] || 0, 4.0);
        
        if (analysis.isColorSearch) {
            analysis.categoryPriorities['footwear'] = 5.0;
        }
    }
    
    if (queryLower.match(/\b(phone|smartphone|mobile|laptop|computer|tablet|device|laptops|phones|mobiles)\b/)) {
        analysis.detectedIntents.push('ELECTRONICS_SEARCH');
        analysis.categoryPriorities['electronics'] = Math.max(analysis.categoryPriorities['electronics'] || 0, 4.0);
        
        if (analysis.isColorSearch) {
            analysis.categoryPriorities['electronics'] = 5.0;
        }
    }
    
    // Brand detection
    words.forEach(word => {
        if (BRAND_MAPPINGS[word]) {
            const brandMapping = BRAND_MAPPINGS[word];
            analysis.detectedIntents.push(`${brandMapping.category.toUpperCase()}_SEARCH`);
            analysis.categoryPriorities[brandMapping.category] = Math.max(analysis.categoryPriorities[brandMapping.category] || 0, 4.0);
            
            if (analysis.isColorSearch) {
                analysis.categoryPriorities[brandMapping.category] = 5.0;
            }
        }
    });
    
    return analysis;
}

function buildSemanticQuery(originalQuery, semanticAnalysis) {
    const { expandedTerms, categoryPriorities } = semanticAnalysis;
    
    const enhancedTerms = [originalQuery];
    
    if (expandedTerms.size > 0) {
        expandedTerms.forEach(term => {
            if (!originalQuery.toLowerCase().includes(term)) {
                enhancedTerms.push(term);
            }
        });
    }
    
    return {
        originalQuery,
        enhancedQuery: enhancedTerms.join(' '),
        expandedTerms: Array.from(expandedTerms),
        categoryPriorities
    };
}

function applySemanticScoring(results, semanticAnalysis) {
    const { categoryPriorities, detectedIntents, detectedColor, isColorSearch } = semanticAnalysis;
    
    return results.map(result => {
        let semanticScore = result.nlp_score || 0;
        
        if (result.category && categoryPriorities[result.category]) {
            semanticScore += categoryPriorities[result.category] * 3;
        }
        
        if (isColorSearch && detectedColor && result.color) {
            const productColor = result.color.toLowerCase();
            if (productColor.includes(detectedColor) || detectedColor.includes(productColor)) {
                semanticScore += 50.0; 
            } else {
                semanticScore -= 20.0; 
            }
        }
        
        if (detectedIntents.includes('CLOTHING_SEARCH') && result.category === 'fashion') {
            semanticScore += isColorSearch ? 30.0 : 15.0; 
        }
        
        if (detectedIntents.includes('FOOTWEAR_SEARCH') && result.category === 'footwear') {
            semanticScore += isColorSearch ? 30.0 : 15.0; 
        }
        
        if (detectedIntents.includes('ELECTRONICS_SEARCH') && result.category === 'electronics') {
            semanticScore += isColorSearch ? 30.0 : 15.0; 
        }
        
        const colorPenaltyMultiplier = isColorSearch ? 3.0 : 1.5;
        
        if (detectedIntents.includes('CLOTHING_SEARCH') && result.category === 'footwear') {
            semanticScore -= 15.0 * colorPenaltyMultiplier;
        }
        
        if (detectedIntents.includes('CLOTHING_SEARCH') && result.category === 'electronics') {
            semanticScore -= 25.0 * colorPenaltyMultiplier; 
        }
        
        if (detectedIntents.includes('FOOTWEAR_SEARCH') && result.category === 'fashion') {
            semanticScore -= 12.0 * colorPenaltyMultiplier;
        }
        
        if (detectedIntents.includes('FOOTWEAR_SEARCH') && result.category === 'electronics') {
            semanticScore -= 30.0 * colorPenaltyMultiplier;
        }
        
        if (detectedIntents.includes('ELECTRONICS_SEARCH') && result.category === 'fashion') {
            semanticScore -= 10.0 * colorPenaltyMultiplier;
        }
        
        if (detectedIntents.includes('ELECTRONICS_SEARCH') && result.category === 'footwear') {
            semanticScore -= 10.0 * colorPenaltyMultiplier;
        }
        
        // Brand-based scoring adjustments
        if (detectedIntents.some(intent => intent.endsWith('_SEARCH')) && result.brand) {
            const brandMapping = BRAND_MAPPINGS[result.brand.toLowerCase()];
            if (brandMapping) {
                semanticScore += 20.0; 
                
                if (detectedIntents.includes('CLOTHING_SEARCH') && brandMapping.category === 'fashion') {
                    semanticScore += 10.0; 
                }
                
                if (detectedIntents.includes('FOOTWEAR_SEARCH') && brandMapping.category === 'footwear') {
                    semanticScore += 10.0; 
                }
                
                if (detectedIntents.includes('ELECTRONICS_SEARCH') && brandMapping.category === 'electronics') {
                    semanticScore += 10.0; 
                }
            }
        }
        
        return {
            ...result,
            semantic_score: semanticScore,
            color_match: isColorSearch && detectedColor && result.color && 
                         (result.color.toLowerCase().includes(detectedColor) || detectedColor.includes(result.color.toLowerCase())),
            intent_match: detectedIntents.some(intent => {
                if (intent === 'CLOTHING_SEARCH') return result.category === 'fashion';
                if (intent === 'FOOTWEAR_SEARCH') return result.category === 'footwear';
                if (intent === 'ELECTRONICS_SEARCH') return result.category === 'electronics';
                return false;
            })
        };
    });
}

module.exports = {
    SEMANTIC_MAPPINGS,
    CATEGORY_MAPPINGS,
    COLORS,
    analyzeSemanticIntent,
    buildSemanticQuery,
    applySemanticScoring
};
