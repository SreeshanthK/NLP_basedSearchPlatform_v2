const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');

let winkNlp;
try {
    winkNlp = winkNLP(model);
} catch (error) {
    winkNlp = null;
}

function getNLPInstance() {
    return winkNlp;
}

function analyzeQueryWithNLP(query) {
    if (!winkNlp) {
        return {
            tokens: query.toLowerCase().split(/\s+/),
            entities: [],
            brands: [],
            categories: [],
            confidence: 0
        };
    }

    try {
        const doc = winkNlp.readDoc(query);

        const tokens = [];
        const entities = [];
        const brands = [];
        const categories = [];

        doc.tokens().each(token => {
            const text = token.out().toLowerCase();
            tokens.push(text);

            if (token.out(winkNlp.its.pos) === 'NNP' || token.out(winkNlp.its.pos) === 'NNPS') {
                brands.push(text);
            }

            const categoryWords = ['shoes', 'phone', 'laptop', 'shirt', 'dress', 'jeans', 'tablet'];
            if (categoryWords.includes(text)) {
                categories.push(text);
            }
        });

        if (doc.entities) {
            doc.entities().each(entity => {
                entities.push({
                    text: entity.out(),
                    type: entity.out(winkNlp.its.type),
                    confidence: entity.out(winkNlp.its.confidence) || 0.8
                });
            });
        }

        return {
            tokens,
            entities,
            brands,
            categories,
            confidence: tokens.length > 0 ? 0.8 : 0
        };
    } catch (error) {
        console.error('NLP analysis failed:', error);
        return {
            tokens: query.toLowerCase().split(/\s+/),
            entities: [],
            brands: [],
            categories: [],
            confidence: 0
        };
    }
}

function calculateRelevanceScore(result, nlpAnalysis, semanticAnalysis) {
    if (!result || !nlpAnalysis) return 0;

    let score = 0;
    const resultText = `${result.name} ${result.brand} ${result.category} ${result.subcategory}`.toLowerCase();

    if (semanticAnalysis && semanticAnalysis.detectedIntents) {
        score += 3.0;
    }

    nlpAnalysis.tokens.forEach(token => {
        if (token.length < 3) return;

        if (resultText.includes(token)) {
            score += 1.5;
        }

        const words = resultText.split(/\s+/);
        for (const word of words) {
            if (word.includes(token) || token.includes(word)) {
                score += 1.0;
                break;
            }
        }
    });

    nlpAnalysis.brands.forEach(brand => {
        if (result.brand && result.brand.toLowerCase().includes(brand)) {
            score += 8;
        } else if (brand.length > 3) {

            if (result.name && result.name.toLowerCase().includes(brand)) {
                score += 3;
            }
        }
    });

    nlpAnalysis.categories.forEach(category => {
        if (result.category && result.category.toLowerCase().includes(category)) {
            score += 4;
        }
        if (result.subcategory && result.subcategory.toLowerCase().includes(category)) {
            score += 4;
        }

        if (result.description && result.description.toLowerCase().includes(category)) {
            score += 2;
        }
    });

    if (result.intent_match) {
        score += 15;
    }

    if (result.color_match) {
        score += 10;
    }

    if (semanticAnalysis.detectedIntents.includes('FOOTWEAR_SEARCH') && result.category === 'electronics') {
        score -= 30;
    }
    if (semanticAnalysis.detectedIntents.includes('ELECTRONICS_SEARCH') && result.category === 'footwear') {
        score -= 30;
    }
    if (semanticAnalysis.detectedIntents.includes('CLOTHING_SEARCH') && result.category === 'electronics') {
        score -= 30;
    }

    return score;
}

module.exports = {
    getNLPInstance,
    analyzeQueryWithNLP,
    calculateRelevanceScore
};