import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search products with NLP capabilities
export const searchProducts = async (query, filters = {}) => {
  try {
    console.log('Applying filters:', filters);
    
    // Prepare filter parameters for the backend
    const filterParams = {
      query,
      filters: {
        // Handle multiple categories
        category: filters.categories && filters.categories.length > 0 ? filters.categories[0] : undefined,
        
        // Handle brand filters if they exist
        brand: filters.brands && filters.brands.length > 0 ? filters.brands[0] : undefined,
        
        // Price range
        price_min: filters.priceRange?.min,
        price_max: filters.priceRange?.max,
        
        // Handle ratings - pass all selected ratings
        rating_min: filters.ratings && filters.ratings.length > 0 ? Math.min(...filters.ratings) : undefined,
        ratings: filters.ratings && filters.ratings.length > 0 ? filters.ratings : undefined,
      }
    };
    
    // Log the request for debugging
    console.log('Sending search request with params:', filterParams);
    
    const response = await api.post('/search', filterParams);
    
    // If the response is a direct array of products
    if (Array.isArray(response.data)) {
      return formatProducts(response.data);
    }
    
    // If the response is an object with a products property
    if (response.data && response.data.products) {
      return {
        products: formatProducts(response.data.products),
        totalResults: response.data.totalResults || response.data.products.length,
        searchMethods: response.data.searchMethods || {},
        isFallback: response.data.isFallback || false
      };
    }
    
    // Default case - return empty array
    return [];
    
  } catch (error) {
    console.error('Error searching products:', error);
    // Return empty array instead of throwing error to prevent app crashes
    return [];
  }
};

// Helper function to format product data consistently
const formatProducts = (productsData) => {
  return productsData.map(product => ({
    id: product.id || product._id || String(Math.random()),
    _id: product._id || product.id || String(Math.random()),
    name: product.name || product.title || 'Unknown Product',
    description: product.description || '',
    price: product.price || 0,
    image: product.image || 'https://via.placeholder.com/300',
    category: product.category || '',
    subcategory: product.subcategory || '',
    brand: product.brand || '',
    averageRating: product.averageRating || product.rating || 0,
    color: product.color || '',
    gender: product.gender || '',
    material: product.material || '',
    size: product.size || '',
    stocks: product.stocks || 0,
    tags: Array.isArray(product.tags) ? product.tags : [],
    features: Array.isArray(product.features) ? product.features : [],
    _score: product._score || 0,
    totalReviews: product.totalReviews || 0,
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    searchType: product.searchType || '',
    combinedScore: product.combinedScore || 0,
    vectorScore: product.vectorScore || 0,
    elasticScore: product.elasticScore || 0,
    mongoScore: product.mongoScore || 0
  }));
};

// Get product categories
export const getCategories = async () => {
  try {
    // This would typically be a real API call
    // For now we'll return mock data
    return [
      { id: '1', name: 'Electronics', image: 'https://via.placeholder.com/150' },
      { id: '2', name: 'Clothing', image: 'https://via.placeholder.com/150' },
      { id: '3', name: 'Home & Kitchen', image: 'https://via.placeholder.com/150' },
      { id: '4', name: 'Sports & Outdoors', image: 'https://via.placeholder.com/150' },
      { id: '5', name: 'Books', image: 'https://via.placeholder.com/150' },
      { id: '6', name: 'Beauty & Personal Care', image: 'https://via.placeholder.com/150' },
    ];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export default api; 