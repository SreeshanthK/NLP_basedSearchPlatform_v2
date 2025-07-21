const natural = require('natural');
const fs = require('fs');
const path = require('path');
const cosineSimilarity = require('cosine-similarity');

class VectorSearchService {
    constructor() {
        this.productVectors = new Map();
        this.vocabulary = new Set();
        this.isInitialized = false;
        this.vectorFilePath = path.join(__dirname, '../../data/vectors.json');
        this.tfidf = new natural.TfIdf();
    }

    async initialize() {
        try {

            const dataDir = path.dirname(this.vectorFilePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            if (fs.existsSync(this.vectorFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.vectorFilePath, 'utf8'));
                this.productVectors = new Map(data.vectors || []);
                this.vocabulary = new Set(data.vocabulary || []);
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Vector Search:', error);
            this.isInitialized = false;
            return false;
        }
    }

    preprocessText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractKeyWords(text) {
        const processedText = this.preprocessText(text);
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(processedText) || [];

        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

        const filteredTokens = tokens.filter(token =>
            token.length > 2 &&
            !stopWords.has(token.toLowerCase()) &&
            !/^\d+$/.test(token)
        );

        return filteredTokens.map(token => natural.PorterStemmer.stem(token));
    }

    generateSmartVector(text) {
        const keywords = this.extractKeyWords(text);
        keywords.forEach(keyword => this.vocabulary.add(keyword));

        const vocabArray = Array.from(this.vocabulary).sort();
        const vectorSize = Math.min(500, Math.max(100, vocabArray.length));
        const vector = new Array(vectorSize).fill(0);

        const termFreq = {};
        keywords.forEach(keyword => {
            termFreq[keyword] = (termFreq[keyword] || 0) + 1;
        });

        const totalTerms = keywords.length || 1;

        Object.entries(termFreq).forEach(([term, freq]) => {
            const index = vocabArray.indexOf(term);
            if (index !== -1 && index < vector.length) {
                vector[index] = (freq / totalTerms) + 0.1;
            }
        });

        const categoryBoosts = {
            'phone': ['mobil', 'smartphon', 'iphon', 'samsung', 'android', 'cell'],
            'laptop': ['comput', 'notebook', 'macbook', 'dell', 'hp', 'lenovo'],
            'cloth': ['shirt', 'pant', 'dress', 'jean', 'jacket', 't-shirt'],
            'shoe': ['sneaker', 'boot', 'sandal', 'heel', 'footwear', 'runner'],
            'electron': ['gadget', 'devic', 'tech', 'digit', 'smart'],
            'book': ['novel', 'textbook', 'guid', 'manual', 'read'],
            'sport': ['fit', 'exercis', 'gym', 'athlet', 'train']
        };

        keywords.forEach(keyword => {
            Object.entries(categoryBoosts).forEach(([category, synonyms]) => {
                if (synonyms.some(syn => keyword.includes(syn) || syn.includes(keyword))) {
                    synonyms.forEach(syn => {
                        const synIndex = vocabArray.indexOf(syn);
                        if (synIndex !== -1 && synIndex < vector.length) {
                            vector[synIndex] += 0.3;
                        }
                    });
                }
            });
        });

        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= magnitude;
            }
        }

        return vector;
    }

    async indexProduct(product) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {

            const searchableText = [
                product.name || '',
                product.title || '',
                product.description || '',
                product.category || '',
                product.subcategory || '',
                product.brand || '',
                product.gender || '',
                product.season || '',
                product.color || '',
                (product.tags || []).join(' '),
                (product.features || []).join(' ')
            ].filter(Boolean).join(' ');

            const vector = this.generateSmartVector(searchableText);

            this.productVectors.set(product._id.toString(), {
                vector: vector,
                metadata: {
                    name: product.name,
                    title: product.title,
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: product.brand,
                    price: product.price,
                    gender: product.gender,
                    season: product.season,
                    color: product.color,
                    averageRating: product.averageRating || 0,
                    totalReviews: product.totalReviews || 0,
                    stocks: product.stocks || 0
                },
                searchText: searchableText.toLowerCase()
            });

            return true;
        } catch (error) {
            console.error('Error indexing product:', error);
            return false;
        }
    }

    async searchSimilar(query, limit = 50, threshold = 0.0001) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.productVectors.size === 0) {
            return [];
        }

        try {
            const queryVector = this.generateSmartVector(query);
            const queryKeywords = this.extractKeyWords(query);
            const results = [];

            for (const [productId, productData] of this.productVectors.entries()) {
                try {
                    let similarity = cosineSimilarity(queryVector, productData.vector);

                    let semanticBonus = 0;

                    queryKeywords.forEach(keyword => {

                        if (productData.searchText.includes(keyword)) {
                            semanticBonus += 0.5;
                        }

                        const searchWords = productData.searchText.split(' ');
                        searchWords.forEach(word => {
                            if (word.includes(keyword) || keyword.includes(word)) {
                                semanticBonus += 0.3;
                            }

                            if (Math.abs(word.length - keyword.length) <= 3) {
                                const editDistance = this.levenshteinDistance(word, keyword);
                                if (editDistance <= 3) {
                                    semanticBonus += 0.2;
                                }
                            }
                        });
                    });

                    queryKeywords.forEach(keyword => {
                        if (productData.metadata.category && productData.metadata.category.toLowerCase().includes(keyword)) {
                            semanticBonus += 0.3;
                        }
                        if (productData.metadata.brand && productData.metadata.brand.toLowerCase().includes(keyword)) {
                            semanticBonus += 0.3;
                        }
                    });

                    const finalSimilarity = Math.min(1.0, similarity + semanticBonus);

                    if (finalSimilarity >= threshold || similarity >= 0.0001) {
                        results.push({
                            productId: productId,
                            similarity: finalSimilarity,
                            baseSimilarity: similarity,
                            semanticBonus: semanticBonus,
                            metadata: productData.metadata
                        });
                    }
                } catch (err) {
                    console.error(`Error calculating similarity for product ${productId}:`, err);
                }
            }

            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

        } catch (error) {
            console.error('Error in vector search:', error);
            return [];
        }
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    async bulkIndexProducts(products) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        let successCount = 0;

        for (let i = 0; i < products.length; i++) {
            const success = await this.indexProduct(products[i]);
            if (success) successCount++;

            if ((i + 1) % 10 === 0) {
            }
        }

        await this.saveVectors();
        return successCount;
    }

    async saveVectors() {
        try {
            const data = {
                vectors: Array.from(this.productVectors.entries()),
                vocabulary: Array.from(this.vocabulary),
                timestamp: new Date().toISOString()
            };

            fs.writeFileSync(this.vectorFilePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving vectors:', error);
        }
    }

    async getCollectionInfo() {
        return {
            totalProducts: this.productVectors.size,
            vocabularySize: this.vocabulary.size,
            isInitialized: this.isInitialized
        };
    }

    clearIndex() {
        this.productVectors.clear();
        this.vocabulary.clear();
        this.tfidf = new natural.TfIdf();
    }

    async search(query, limit = 50) {
        const results = await this.searchSimilar(query, limit);
        return results.map(result => ({
            id: result.productId,
            title: result.metadata.title,
            category: result.metadata.category,
            brand: result.metadata.brand,
            price: result.metadata.price,
            score: result.similarity
        }));
    }

    getIndexStats() {
        const categories = new Set();
        const brands = new Set();

        for (const [productId, productData] of this.productVectors) {
            if (productData.category) categories.add(productData.category);
            if (productData.brand) brands.add(productData.brand);
        }

        return {
            totalDocuments: this.productVectors.size,
            totalTerms: this.vocabulary.size,
            categories: Array.from(categories),
            brands: Array.from(brands)
        };
    }

    async clearVectors() {
        this.productVectors.clear();
        this.vocabulary.clear();
        if (fs.existsSync(this.vectorFilePath)) {
            fs.unlinkSync(this.vectorFilePath);
        }
    }
}

module.exports = new VectorSearchService();