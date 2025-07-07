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
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/', searchRoutes);
app.use('/', testRoutes);

// Add a simple products endpoint for the home page
app.get('/api/products', (req, res) => {
    const products = [
        {
            id: '1',
            name: 'Wireless Noise-Cancelling Headphones',
            description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life',
            price: 199.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'SoundMaster',
            color: 'Black',
            rating: 4.5,
            stock: 45,
            material: 'Premium Leather/Metal',
            tags: ['wireless', 'bluetooth', 'noise-cancelling', 'headphones'],
            _score: 8.7
        },
        {
            id: '2',
            name: 'Ultra Smartphone Pro Max',
            description: 'Latest model with high-resolution camera, fast processor, and all-day battery life',
            price: 899.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'TechGiant',
            color: 'Midnight Blue',
            rating: 4.8,
            stock: 23,
            features: ['5G', '128GB Storage', 'Triple Camera'],
            tags: ['smartphone', '5G', 'high-resolution', 'premium'],
            _score: 9.2
        },
        {
            id: '3',
            name: 'Professional Laptop Ultra',
            description: 'Powerful laptop for work and gaming with dedicated graphics and fast processor',
            price: 1299.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'CompTech',
            color: 'Silver',
            rating: 4.7,
            stock: 12,
            features: ['16GB RAM', '512GB SSD', 'Dedicated Graphics'],
            tags: ['laptop', 'gaming', 'professional', 'high-performance'],
            _score: 8.9
        },
        {
            id: '4',
            name: 'Smart Fitness Watch',
            description: 'Track your fitness, heart rate, and stay connected with notifications',
            price: 249.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'FitTech',
            color: 'Black/Silver',
            rating: 4.2,
            stock: 38,
            waterproof: true,
            tags: ['smartwatch', 'fitness', 'heart-rate', 'waterproof'],
            _score: 7.5
        },
        {
            id: '5',
            name: 'Portable Bluetooth Speaker',
            description: 'Portable speaker with amazing sound quality and 12-hour battery life',
            price: 129.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'AudioPro',
            color: 'Red',
            rating: 4.3,
            stock: 50,
            waterproof: true,
            tags: ['speaker', 'bluetooth', 'portable', 'waterproof'],
            _score: 8.1
        },
        {
            id: '6',
            name: 'Professional Tablet Pro',
            description: 'Perfect for entertainment, creativity and productivity with stylus support',
            price: 499.99,
            image: 'https://via.placeholder.com/300',
            category: 'Electronics',
            brand: 'TechGiant',
            color: 'Space Gray',
            rating: 4.6,
            stock: 18,
            features: ['10.5-inch display', '256GB Storage', 'Stylus Support'],
            tags: ['tablet', 'stylus', 'creative', 'professional'],
            _score: 8.4
        }
    ];
    
    res.json(products);
});

async function startServer() {
    await initializeConnections();
    
    app.listen(PORT, 'localhost', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
