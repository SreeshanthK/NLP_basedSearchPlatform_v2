import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts, getCategories } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        const data = await getFeaturedProducts();
        setProducts(data);
        
        const categoryData = await getCategories();
        setCategories(categoryData);
        
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Scroll to the product details section
    document.getElementById('product-details')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderProductDetails = () => {
    if (!selectedProduct) return null;

    return (
      <div id="product-details" className="mb-16 scroll-mt-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Product Details</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-100">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                className="w-full h-full object-cover object-center min-h-[300px]"
              />
            </div>
            <div className="md:w-2/3 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2">
                    {selectedProduct.category && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {selectedProduct.category}
                      </span>
                    )}
                    {selectedProduct.brand && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                        {selectedProduct.brand}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
                </div>
                <div className="flex items-center">
                  {selectedProduct.rating && (
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="font-semibold">{selectedProduct.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProduct.brand && (
                    <div>
                      <span className="text-gray-500">Brand:</span> {selectedProduct.brand}
                    </div>
                  )}
                  {selectedProduct.color && (
                    <div>
                      <span className="text-gray-500">Color:</span> {selectedProduct.color}
                    </div>
                  )}
                  {selectedProduct.material && (
                    <div>
                      <span className="text-gray-500">Material:</span> {selectedProduct.material}
                    </div>
                  )}
                  {selectedProduct.stock && (
                    <div>
                      <span className="text-gray-500">In Stock:</span> {selectedProduct.stock} units
                    </div>
                  )}
                </div>
              </div>
              
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProduct._score !== undefined && selectedProduct._score !== null && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">NLP Relevance Score</h3>
                  <div className="text-gray-700">
                    Raw score: {selectedProduct._score}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-8">
                <span className="text-3xl font-bold text-gray-900">${selectedProduct.price.toFixed(2)}</span>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Discover Amazing Products</h1>
            <p className="text-xl mb-8 text-gray-700">Find exactly what you're looking for with our NLP-powered search</p>
            <Link 
              to="/search" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg inline-flex items-center"
            >
              Start Searching
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Products Section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Featured Products</h2>
            <Link to="/search" className="text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                onClick={() => handleProductSelect(product)}
                className="cursor-pointer"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details Section */}
        {renderProductDetails()}

        {/* Categories Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-900">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/search?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">{getCategoryIcon(category.name)}</div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium text-gray-800">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg p-10 text-center border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Try Our NLP-Powered Search</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Search for products using natural language. Try phrases like "red shoes under $100" or "high-rated smartphones"
          </p>
          <Link 
            to="/search" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block font-medium"
          >
            Search Now
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper function to get category icons
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Electronics': '📱',
    'Clothing': '👕',
    'Home & Kitchen': '🏠',
    'Sports & Outdoors': '⚽',
    'Books': '📚',
    'Beauty & Personal Care': '💄',
  };
  
  return icons[categoryName] || '🛍️';
};

export default Home; 