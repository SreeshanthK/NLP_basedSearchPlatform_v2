import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get featured products for the home page
export const getFeaturedProducts = async () => {
  try {
    const response = await api.get('/api/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

// Search products with NLP capabilities
export const searchProducts = async (query, filters = {}) => {
  try {
    console.log('Applying filters:', filters);
    
    // Prepare filter parameters for the backend
    const filterParams = {
      query,
      filters: {
        // Handle multiple categories
        category: filters.categories && filters.categories.length > 0 ? filters.categories : undefined,
        
        // Handle brand filters if they exist
        brand: filters.brands && filters.brands.length > 0 ? filters.brands : undefined,
        
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
    
    // Process the response to ensure all product data is properly formatted
    const products = response.data.map(product => ({
      id: product.id || product._id || String(Math.random()),
      name: product.name || product.title || 'Unknown Product',
      description: product.description || '',
      price: product.price || 0,
      image: product.image || 'https://via.placeholder.com/300',
      category: product.category || '',
      brand: product.brand || '',
      rating: product.rating || null,
      color: product.color || '',
      gender: product.gender || '',
      material: product.material || '',
      size: product.size || '',
      stock: product.stock || null,
      tags: Array.isArray(product.tags) ? product.tags : [],
      _score: product._score,
      features: product.features || []
    }));
    
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
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