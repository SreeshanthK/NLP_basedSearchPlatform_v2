const mongoose = require('mongoose');
const vectorService = require('../services/vectorService');
require('dotenv').config();
async function indexAllProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully');
        console.log('Initializing Vector Service...');
        const initialized = await vectorService.initialize();
        if (!initialized) {
            console.error('Vector service failed to initialize');
            process.exit(1);
        }
        const db = mongoose.connection.db;
        const collection = db.collection('products');
        console.log('Fetching products from MongoDB...');
        const products = await collection.find({}).limit(100).toArray();
        console.log(`Found ${products.length} products to index`);
        if (products.length === 0) {
            console.log('No products found in database');
            process.exit(0);
        }
        console.log('Starting bulk indexing...');
        const successCount = await vectorService.bulkIndexProducts(products);
        const info = await vectorService.getCollectionInfo();
        console.log('Indexing completed successfully');
        console.log('Vector collection info:', info);
        console.log(`Successfully indexed: ${successCount}/${products.length} products`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Indexing failed:', error);
        process.exit(1);
    }
}
console.log('Starting product indexing for vector search...');
indexAllProducts();
