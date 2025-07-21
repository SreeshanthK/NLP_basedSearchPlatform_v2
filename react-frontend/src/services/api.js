import axios from 'axios';

const API_BASE_URL = 'https://search-relevance-optimizer-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

    }
    return Promise.reject(error);
  }
);

export const searchProducts = async (query, filters = {}) => {
  try {

    const filterParams = {
      query,
      filters: {

        category: filters.categories && filters.categories.length > 0 ? filters.categories[0] : undefined,

        brand: filters.brands && filters.brands.length > 0 ? filters.brands[0] : undefined,

        price_min: filters.priceRange?.min,
        price_max: filters.priceRange?.max,

        rating_min: filters.ratings && filters.ratings.length > 0 ? Math.min(...filters.ratings) : undefined,
        ratings: filters.ratings && filters.ratings.length > 0 ? filters.ratings : undefined,
      }
    };

    const response = await api.post('/search', filterParams);

    if (Array.isArray(response.data)) {
      return {
        products: formatProducts(response.data),
        extractedFilters: null
      };
    }

    if (response.data && response.data.products) {
      return {
        products: formatProducts(response.data.products),
        totalResults: response.data.totalResults || response.data.products.length,
        searchMethods: response.data.searchMethods || {},
        isFallback: response.data.isFallback || false,
        extractedFilters: response.data.extractedFilters || null,
        nlpAnalysis: response.data.nlpAnalysis || null
      };
    }

    return {
      products: [],
      extractedFilters: null
    };

  } catch (error) {
    console.error('Error searching products:', error);

    if (error.response?.status === 401) {
      throw error;
    }

    return {
      products: [],
      extractedFilters: null
    };
  }
};

export const analyzeReviews = async (reviews) => {
  try {
    if (!reviews || reviews.length === 0) {
      return {
        summary: 'No reviews available to analyze.',
        categoryRatings: {},
        overallSentiment: { score: 0, label: 'neutral' }
      };
    }

    const response = await api.post('/api/reviews/analyze', { reviews });
    return response.data;
  } catch (error) {
    console.error('Error analyzing reviews:', error);
    return {
      summary: 'Failed to analyze reviews.',
      categoryRatings: {},
      error: error.message,
      overallSentiment: { score: 0, label: 'neutral' }
    };
  }
};

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
    reviews: product.reviews || [],
    searchType: product.searchType || '',
    combinedScore: product.combinedScore || 0,
    vectorScore: product.vectorScore || 0,
    elasticScore: product.elasticScore || 0,
    mongoScore: product.mongoScore || 0
  }));
};

export const getCategories = async () => {
  try {

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

export const getAllProducts = async () => {
  try {
    const response = await api.get('/api/products');

    if (Array.isArray(response.data)) {
      return formatProducts(response.data);
    }

    if (response.data && response.data.products) {
      return formatProducts(response.data.products);
    }

    return await searchProducts('*', {});

  } catch (error) {
    console.error('Error fetching all products:', error);

    try {
      return await searchProducts('*', {});
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      return [];
    }
  }
};

export default api;

export const authService = {

  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);

        const user = { email, role: 'customer' };
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        const user = { email: userData.email, role: userData.role || 'customer' };
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
      }
      throw new Error(response.data.message || 'Signup failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Signup failed');
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  }
};
