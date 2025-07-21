const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initializeConnections } = require('./src/config/database');
const searchRoutes = require('./src/routes/searchRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(cors({
  origin: [
    'https://search-relevance-optimizer.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use('/', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'NLP Search Platform',
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'NLP Search Platform API',
        endpoints: {
            search: 'POST /search',
            reviewAnalysis: 'POST /api/reviews/analyze',
            health: 'GET /health',
            debug: 'GET /debug/elasticsearch'
        },
        documentation: 'See README.md and DEPLOYMENT_GUIDE.md'
    });
});

async function startServer() {
    await initializeConnections();

    app.listen(PORT, '0.0.0.0' , () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
