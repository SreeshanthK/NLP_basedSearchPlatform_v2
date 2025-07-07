const express = require('express');
const cors = require('cors');
const { initializeConnections } = require('./src/config/database');
const searchRoutes = require('./src/routes/searchRoutes');
const testRoutes = require('./src/routes/testRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['*'],
    allowedHeaders: ['*']
}));

app.use('/', searchRoutes);
app.use('/', testRoutes);

async function startServer() {
    await initializeConnections();
    
    app.listen(PORT, 'localhost', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
