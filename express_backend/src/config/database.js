const { MongoClient } = require('mongodb');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

let mongoClient = null;
let esClient = null;

async function initializeConnections() {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri && mongoUri !== 'your_mongodb_atlas_uri_here') {
        try {
            mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
        } catch (error) {
            mongoClient = null;
        }
    }

    const elasticUrl = process.env.ELASTIC_URL;
    const elasticApiKey = process.env.ELASTIC_API_KEY;
    
    if (elasticUrl && elasticApiKey && 
        elasticUrl !== 'your_elasticsearch_url_here' && 
        elasticApiKey !== 'your_elasticsearch_api_key_here') {
        try {
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
            
            try {
                await esClient.info();
            } catch (infoError) {
            }
            
        } catch (error) {
            esClient = null;
        }
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
    getESClient
};
