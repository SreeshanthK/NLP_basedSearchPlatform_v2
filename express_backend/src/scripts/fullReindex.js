const { MongoClient } = require('mongodb');
const { Client } = require('@elastic/elasticsearch');
const vectorService = require('../services/vectorService');
require('dotenv').config();

async function fullReindex() {
    console.log('🔄 Starting full reindex process...');
    
    let mongoClient = null;
    let esClient = null;
    
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri || mongoUri === 'your_mongodb_atlas_uri_here') {
            throw new Error('MongoDB URI not configured');
        }
        
        console.log('🍃 Connecting to MongoDB...');
        mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        console.log('✅ Connected to MongoDB');

        const elasticUrl = process.env.ELASTIC_URL;
        const elasticApiKey = process.env.ELASTIC_API_KEY;
        
        if (elasticUrl && elasticApiKey && 
            elasticUrl !== 'your_elasticsearch_url_here' && 
            elasticApiKey !== 'your_elasticsearch_api_key_here') {
            
            console.log('🔍 Connecting to Elasticsearch...');
            esClient = new Client({
                node: elasticUrl,
                auth: {
                    apiKey: elasticApiKey
                },
                maxRetries: 3,
                requestTimeout: 30000,
                sniffOnStart: false
            });

            await esClient.ping();
            console.log('✅ Connected to Elasticsearch');
        } else {
            console.log('⚠️ Elasticsearch not configured, skipping Elasticsearch indexing...');
        }

        console.log('🔮 Initializing Vector Service...');
        const vectorInitialized = await vectorService.initialize();
        if (!vectorInitialized) {
            throw new Error('Vector service failed to initialize');
        }
        console.log('✅ Vector service initialized');

        const db = mongoClient.db('ecommerce');
        const collection = db.collection('products');
        
        console.log('📦 Fetching products from MongoDB...');
        const products = await collection.find({}).toArray();
        console.log(`✅ Found ${products.length} products to index`);

        if (products.length === 0) {
            console.log('⚠️ No products found in database. Make sure your MongoDB has product data.');
            return;
        }

        if (esClient) {
            console.log('🔍 Indexing products in Elasticsearch...');
            
            const bulkBody = [];
            for (const product of products) {
                const searchableText = [
                    product.name,
                    product.title,
                    product.description,
                    product.category,
                    product.subcategory,
                    product.brand,
                    product.gender,
                    product.season,
                    product.color,
                    ...(product.tags || []),
                    ...(product.features || [])
                ].filter(Boolean).join(' ');

                bulkBody.push({
                    index: {
                        _index: 'products',
                        _id: product._id.toString()
                    }
                });

                bulkBody.push({
                    name: product.name,
                    title: product.title,
                    description: product.description,
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: product.brand,
                    price: product.price,
                    gender: product.gender,
                    season: product.season,
                    color: product.color,
                    stocks: product.stocks,
                    tags: product.tags || [],
                    features: product.features || [],
                    averageRating: product.averageRating || 0,
                    totalReviews: product.totalReviews || 0,
                    searchable_text: searchableText
                });
            }

            try {
                const bulkResponse = await esClient.bulk({ body: bulkBody });
                
                if (bulkResponse.errors) {
                    console.log('⚠️ Some documents failed to index in Elasticsearch:');
                    bulkResponse.items.forEach((action, i) => {
                        const operation = Object.keys(action)[0];
                        if (action[operation].error) {
                            console.log(`   Document ${i}: ${action[operation].error.reason}`);
                        }
                    });
                } else {
                    console.log(`✅ Successfully indexed ${products.length} products in Elasticsearch`);
                }

                await esClient.indices.refresh({ index: 'products' });
                console.log('✅ Elasticsearch index refreshed');
                
            } catch (esIndexError) {
                console.error('❌ Elasticsearch indexing failed:', esIndexError.message);
            }
        }

        console.log('🔮 Indexing products in Vector Service...');
        const vectorSuccessCount = await vectorService.bulkIndexProducts(products);
        console.log(`✅ Successfully indexed ${vectorSuccessCount}/${products.length} products in Vector Service`);

        
        console.log('\n📊 Final Statistics:');
        console.log(`   MongoDB Products: ${products.length}`);
        
        if (esClient) {
            try {
                const esStats = await esClient.count({ index: 'products' });
                console.log(`   Elasticsearch Documents: ${esStats.count}`);
            } catch (error) {
                console.log('   Elasticsearch Documents: Error getting count');
            }
        }

        const vectorInfo = await vectorService.getCollectionInfo();
        console.log(`   Vector Service Products: ${vectorInfo.totalProducts}`);
        console.log(`   Vector Service Vocabulary: ${vectorInfo.vocabularySize} terms`);

        console.log('\n🎉 Full reindex completed successfully!');
        console.log('📝 Next steps:');
        console.log('   1. Restart your backend server');
        console.log('   2. Test search functionality');

    } catch (error) {
        console.error('❌ Full reindex failed:', error);
        throw error;
    } finally {
        // Clean up connections
        if (mongoClient) {
            await mongoClient.close();
            console.log('🍃 MongoDB connection closed');
        }
    }
}

// Run the script
if (require.main === module) {
    fullReindex()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fullReindex };
