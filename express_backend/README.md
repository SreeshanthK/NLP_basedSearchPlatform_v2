# NLP-Based Search Backend - Restructured

This is a professionally restructured version of the NLP-based search backend. The code has been organized into a clean, modular architecture following industry best practices.

## Project Structure

```
express_backend/
├── server.js                 # Main server entry point
├── package.json              # Project dependencies
├── README.md                 # This documentation
└── src/                      # Source code directory
    ├── index.js              # Module exports (for external usage)
    ├── config/               # Configuration files
    │   ├── database.js       # MongoDB & Elasticsearch setup
    │   └── nlp.js           # WinkNLP configuration
    ├── controllers/          # Request handlers
    │   ├── searchController.js    # Search endpoint logic
    │   └── testController.js      # Test data & debug endpoints
    ├── services/             # Business logic
    │   ├── nlpService.js     # NLP parsing & intelligence
    │   ├── fallbackService.js    # Fallback parsing
    │   ├── scoringService.js      # Product scoring algorithms
    │   └── searchService.js       # Search orchestration
    ├── routes/              # Route definitions
    │   ├── searchRoutes.js   # Search API routes
    │   └── testRoutes.js     # Test/debug routes
    └── utils/               # Utility functions
        ├── textUtils.js      # Text preprocessing & utilities
        └── fuzzyMatch.js     # Fuzzy matching algorithms
```

## 🔧 Architecture Components

### **Config Layer** (`src/config/`)
- **database.js**: Manages MongoDB and Elasticsearch connections
- **nlp.js**: Initializes and configures WinkNLP

### **Controllers Layer** (`src/controllers/`)
- **searchController.js**: Handles search requests, validates input, orchestrates services
- **testController.js**: Manages sample data insertion and debugging endpoints

### **Services Layer** (`src/services/`)
- **nlpService.js**: Advanced NLP query parsing with entity extraction
- **fallbackService.js**: Simple fallback parsing when NLP is unavailable
- **scoringService.js**: Product relevance scoring and ranking algorithms
- **searchService.js**: Orchestrates search across Elasticsearch and MongoDB

### **Routes Layer** (`src/routes/`)
- **searchRoutes.js**: Defines search API endpoints
- **testRoutes.js**: Defines test and debug endpoints

### **Utils Layer** (`src/utils/`)
- **textUtils.js**: Text preprocessing, normalization, and similarity functions
- **fuzzyMatch.js**: Fuzzy matching for brands and categories

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with your database configurations:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ELASTIC_URL=your_elasticsearch_url
   ELASTIC_API_KEY=your_elasticsearch_api_key
   PORT=8001
   ```

3. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Search
- **POST** `/search` - Main search endpoint
  ```json
  {
    "query": "nike shoes under 15000"
  }
  ```

### Test & Debug
- **POST** `/test/add-sample-data` - Add sample products to databases
- **GET** `/debug/elasticsearch` - Check Elasticsearch status and configuration

## How It Works

1. **Request Flow**: `Route → Controller → Service → Database`
2. **Query Processing**: Text preprocessing → NLP parsing → Entity extraction
3. **Search Execution**: Elasticsearch (primary) → MongoDB (fallback)
4. **Result Processing**: Relevance scoring → Ranking → Response

