const { getMongoClient, getESClient } = require('../config/database');

class TestController {
    async addSampleData(req, res) {
        try {
            const sampleProducts = [
                {
                    title: "iPhone 14 Pro",
                    description: "Latest Apple smartphone with advanced camera and fast charging support",
                    category: "mobile phones",
                    brand: "apple",
                    price: 99900,
                    rating: 4.5,
                    color: "black",
                    gender: "unisex",
                    tags: ["smartphone", "ios", "apple", "mobile", "fast charging", "wireless charging"]
                },
                {
                    title: "Samsung Galaxy S23",
                    description: "Flagship Android smartphone with fast charging and wireless charging",
                    category: "mobile phones", 
                    brand: "samsung",
                    price: 74999,
                    rating: 4.3,
                    color: "white",
                    gender: "unisex",
                    tags: ["smartphone", "android", "samsung", "mobile", "fast charging", "5g"]
                },
                {
                    title: "OnePlus 11 5G",
                    description: "High performance Android smartphone with super fast charging technology",
                    category: "mobile phones",
                    brand: "oneplus", 
                    price: 56999,
                    rating: 4.4,
                    color: "green",
                    gender: "unisex",
                    tags: ["smartphone", "android", "oneplus", "5g", "fast charging", "gaming"]
                },
                {
                    title: "Xiaomi Redmi Note 12",
                    description: "Budget Android smartphone with fast charging and great performance",
                    category: "mobile phones",
                    brand: "xiaomi", 
                    price: 15999,
                    rating: 4.2,
                    color: "blue",
                    gender: "unisex",
                    tags: ["smartphone", "android", "xiaomi", "budget", "fast charging", "redmi"]
                },
                {
                    title: "Nike Air Max 270",
                    description: "Comfortable running shoes for men with air cushioning",
                    category: "sneakers",
                    brand: "nike",
                    price: 12995,
                    rating: 4.2,
                    color: "black",
                    gender: "men",
                    tags: ["shoes", "running", "nike", "sneakers", "air max", "black shoes"]
                },
                {
                    title: "Adidas Ultraboost 22",
                    description: "Premium running shoes with boost technology",
                    category: "sneakers",
                    brand: "adidas",
                    price: 16999,
                    rating: 4.4,
                    color: "white",
                    gender: "unisex",
                    tags: ["shoes", "running", "adidas", "sneakers", "boost", "white shoes"]
                },
                {
                    title: "Puma RS-X3",
                    description: "Stylish black sneakers for casual wear",
                    category: "sneakers",
                    brand: "puma",
                    price: 8999,
                    rating: 4.1,
                    color: "black",
                    gender: "unisex",
                    tags: ["shoes", "casual", "puma", "sneakers", "black shoes", "style"]
                },
                {
                    title: "boAt Airdopes 131",
                    description: "Wireless earbuds with great sound quality and fast charging case",
                    category: "headphones",
                    brand: "boat",
                    price: 1999,
                    rating: 4.1,
                    color: "black",
                    gender: "unisex", 
                    tags: ["earbuds", "wireless", "boat", "audio", "fast charging", "bluetooth"]
                },
                {
                    title: "Sony WH-1000XM4",
                    description: "Premium noise cancelling headphones with fast charging",
                    category: "headphones",
                    brand: "sony",
                    price: 29990,
                    rating: 4.6,
                    color: "black",
                    gender: "unisex", 
                    tags: ["headphones", "wireless", "sony", "noise cancelling", "premium", "fast charging"]
                },
                {
                    title: "Cotton T-Shirt Premium",
                    description: "100% cotton comfortable t-shirt for daily wear",
                    category: "shirts",
                    brand: "generic",
                    price: 599,
                    rating: 4.0,
                    color: "blue",
                    gender: "men",
                    tags: ["tshirt", "cotton", "clothing", "casual", "comfort"]
                },
                {
                    title: "Cotton Formal Shirt",
                    description: "Premium cotton formal shirt for office wear",
                    category: "shirts", 
                    brand: "generic",
                    price: 1299,
                    rating: 4.3,
                    color: "white",
                    gender: "men",
                    tags: ["shirt", "cotton", "formal", "office", "business"]
                },
                {
                    title: "MacBook Air M2",
                    description: "Latest Apple laptop with M2 chip and fast charging via USB-C",
                    category: "laptops",
                    brand: "apple",
                    price: 119900,
                    rating: 4.7,
                    color: "silver",
                    gender: "unisex",
                    tags: ["laptop", "apple", "macbook", "m2", "fast charging", "portable"]
                }
            ];

            const mongoClient = getMongoClient();
            const esClient = getESClient();

            let mongoResult = null;
            let esResult = null;

            if (mongoClient) {
                try {
                    const db = mongoClient.db('ecommerce');
                    const collection = db.collection('products');
                    
                    await collection.deleteMany({});
                    
                    const result = await collection.insertMany(sampleProducts);
                    mongoResult = `MongoDB: Inserted ${result.insertedCount} products`;
                } catch (error) {
                    mongoResult = `MongoDB Error: ${error.message}`;
                }
            }

            if (esClient) {
                try {
                    try {
                        await esClient.indices.delete({ index: 'ecommerce' });
                    } catch (deleteError) {
                    }

                    await esClient.indices.create({
                        index: 'ecommerce',
                        body: {
                            mappings: {
                                properties: {
                                    title: { type: 'text' },
                                    description: { type: 'text' },
                                    category: { 
                                        type: 'text',
                                        fields: {
                                            keyword: { type: 'keyword' }
                                        }
                                    },
                                    brand: { 
                                        type: 'text',
                                        fields: {
                                            keyword: { type: 'keyword' }
                                        }
                                    },
                                    color: { 
                                        type: 'text',
                                        fields: {
                                            keyword: { type: 'keyword' }
                                        }
                                    },
                                    gender: { 
                                        type: 'text',
                                        fields: {
                                            keyword: { type: 'keyword' }
                                        }
                                    },
                                    price: { type: 'double' },
                                    rating: { type: 'double' },
                                    tags: { type: 'keyword' }
                                }
                            }
                        }
                    });

                    const body = [];
                    for (const product of sampleProducts) {
                        body.push({ index: { _index: 'ecommerce' } });
                        body.push(product);
                    }

                    const bulkResponse = await esClient.bulk({ body });
                    
                    if (bulkResponse.body?.errors || bulkResponse.errors) {
                        esResult = `Elasticsearch: Bulk insert completed with some errors`;
                    } else {
                        esResult = `Elasticsearch: Indexed ${sampleProducts.length} products`;
                    }
                } catch (error) {
                    esResult = `Elasticsearch Error: ${error.message}`;
                }
            }

            return res.json({
                message: 'Sample data insertion completed',
                mongodb: mongoResult || 'Not configured',
                elasticsearch: esResult || 'Not configured',
                products_count: sampleProducts.length
            });

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async debugElasticsearch(req, res) {
        try {
            const esClient = getESClient();
            
            if (!esClient) {
                return res.json({ 
                    status: 'not_configured',
                    message: 'Elasticsearch is not configured'
                });
            }

            try {
                const pingResult = await esClient.ping();
            } catch (pingError) {
                return res.json({
                    status: 'connection_failed',
                    error: pingError.message
                });
            }

            let clusterInfo = {};
            try {
                const info = await esClient.info();
                clusterInfo = {
                    version: info.body?.version?.number || info.version?.number || 'unknown',
                    cluster_name: info.body?.cluster_name || info.cluster_name || 'unknown'
                };
            } catch (infoError) {
                clusterInfo = { error: infoError.message };
            }

            let indexInfo = {};
            try {
                const indexExists = await esClient.indices.exists({ index: 'ecommerce' });
                if (indexExists.body || indexExists) {
                    const stats = await esClient.indices.stats({ index: 'ecommerce' });
                    const docCount = stats.body?.indices?.ecommerce?.total?.docs?.count || 
                                   stats.indices?.ecommerce?.total?.docs?.count || 0;
                    indexInfo = {
                        exists: true,
                        document_count: docCount
                    };
                } else {
                    indexInfo = { exists: false };
                }
            } catch (indexError) {
                indexInfo = { error: indexError.message };
            }

            let searchTest = {};
            try {
                if (indexInfo.exists) {
                    const searchResult = await esClient.search({
                        index: 'ecommerce',
                        body: {
                            query: { match_all: {} },
                            size: 1
                        }
                    });
                    
                    const hits = searchResult.body?.hits?.hits || searchResult.hits?.hits || [];
                    searchTest = {
                        success: true,
                        sample_document: hits.length > 0 ? hits[0]._source : null
                    };
                } else {
                    searchTest = { success: false, reason: 'Index does not exist' };
                }
            } catch (searchError) {
                searchTest = { success: false, error: searchError.message };
            }

            return res.json({
                status: 'connected',
                cluster_info: clusterInfo,
                index_info: indexInfo,
                search_test: searchTest
            });

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TestController();
