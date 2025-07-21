const { MongoClient } = require('mongodb');
const { Client } = require('@elastic/elasticsearch');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

let mongoClient = null;
let esClient = null;

async function initializeConnections() {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri && mongoUri !== 'your_mongodb_atlas_uri_here') {
        try {
            console.log(' Connecting to MongoDB...');
            await mongoose.connect(mongoUri);

            mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
            console.log(' Mongoose connection successful!');

            const db = mongoClient.db('ecommerce');
            const collections = await db.listCollections().toArray();
            console.log(` Available collections: ${collections.map(c => c.name).join(', ')}`);

            try {
                const productCount = await db.collection('products').countDocuments({});
                console.log(` Found ${productCount} products in database`);
                if (productCount === 0) {
                    console.log(' No products found in database');
                }
            } catch (e) {
                console.error('Error checking products:', e.message);
            }

        } catch (error) {
            console.error('MongoDB connection failed:', error);
            mongoClient = null;
        }
    } else {
        console.log(' MongoDB URI not configured');
    }

    const esUri = process.env.ELASTIC_URL || process.env.ELASTICSEARCH_URL;
    if (esUri && esUri !== 'your_elasticsearch_url_here') {
        try {
            console.log('🔍 Connecting to Elasticsearch...');
            esClient = new Client({
                node: esUri,
                auth: {
                    apiKey: process.env.ELASTIC_API_KEY || process.env.ELASTICSEARCH_API_KEY
                }
            });

            await esClient.ping();
            console.log(' Elasticsearch connection successful!');
        } catch (error) {
            console.error(' Elasticsearch connection failed:', error);
            esClient = null;
        }
    } else {
        console.log(' Elasticsearch URI not configured');
    }
}

function getMongoClient() {
    return mongoClient;
}

function getESClient() {
    return esClient;
}

module.exports = {
    initializeConnections,
    getMongoClient,
    getESClient,
    mongoClient,
    elasticsearchClient: esClient
};