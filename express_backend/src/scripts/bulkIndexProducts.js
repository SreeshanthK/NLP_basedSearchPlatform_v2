const mongoose = require('mongoose');
const vectorService = require('../services/vectorService');
require('dotenv').config();

async function bulkIndexAllProducts() {
    try {
        console.log(' Starting bulk indexing of all products...');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        const db = mongoose.connection.db;
        const collection = db.collection('products');

        console.log('Fetching all products from MongoDB...');
        const allProducts = await collection.find({}).toArray();
        console.log(`Found ${allProducts.length} products in MongoDB`);
        
        if (allProducts.length === 0) {
            console.log(' No products found in MongoDB. Run generateLargeDataset.js first.');
            process.exit(1);
        }

        console.log('Clearing existing vector index...');
        vectorService.clearIndex();

        console.log('Indexing all products for vector search...');
        const startTime = Date.now();
        
        for (let i = 0; i < allProducts.length; i++) {
            const product = allProducts[i];
            vectorService.indexProduct(product);
            
            if ((i + 1) % 10 === 0) {
                console.log(`Indexed ${i + 1}/${allProducts.length} products...`);
            }
        }
        
        const endTime = Date.now();
        console.log(` Successfully indexed ${allProducts.length} products in ${endTime - startTime}ms`);

        console.log('Saving vectors to disk...');
        await vectorService.saveVectors();

        console.log('\n Testing vector search with various queries...');
        
        const testQueries = [
            'apple phone',
            'gaming laptop',
            'running shoes',
            'wireless headphones',
            'black clothing',
            'outdoor gear',
            'luxury watch',
            'electric car',
            'skincare products',
            'fitness tracker'
        ];
        
        for (const query of testQueries) {
            const results = await vectorService.search(query, 3);
            console.log(`\n"${query}" found ${results.length} results:`);
            results.forEach((r, i) => {
                console.log(`  ${i+1}. ${r.title} (score: ${r.score.toFixed(3)}) [${r.category}]`);
            });
        }

        const indexStats = vectorService.getIndexStats();
        console.log('\\n Vector Index Statistics:');
        console.log(`Total documents: ${indexStats.totalDocuments}`);
        console.log(`Total terms: ${indexStats.totalTerms}`);
        console.log(`Categories indexed: ${indexStats.categories.join(', ')}`);
        
        await mongoose.disconnect();
        console.log('\\n🎉 Bulk indexing completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error(' Error during bulk indexing:', error);
        process.exit(1);
    }
}

bulkIndexAllProducts();
