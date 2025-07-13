import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../services/api';
const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const categoryImages = {
    'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop', 
    'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop', 
    'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'Home & Garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop', 
    'Sports & Outdoors': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'Beauty & Personal Care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop', 
    'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop' 
  };
  const sliderImages = [
    {
      url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=300&fit=crop&q=95', 
      title: 'Smart Shopping Experience',
      subtitle: 'Find exactly what you need with intelligent search'
    },
    {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop&q=80', 
      title: 'Quality Products',
      subtitle: 'Discover thousands of quality products at great prices'
    },
    {
      url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=300&fit=crop&q=80', 
      title: 'Fast & Easy Shopping',
      subtitle: 'Shop with confidence using our advanced search technology'
    }
  ];
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoryData = await getCategories();
        const categoriesWithImages = categoryData.map(category => ({
          ...category,
          image: categoryImages[category.name] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
        }));
        setCategories(categoriesWithImages);
        setError(null);
      } catch (err) {
        setError('Failed to load categories. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };
  const handleCategoryClick = (categoryName) => {
    navigate(`/search?query=${encodeURIComponent(categoryName)}`);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <section className="py-16 bg-white">
        <div className="w-full px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              Smart Shopping Experience
            </h1>
            <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
              Experience intelligent search with advanced natural language processing and smart review analysis.
              <br className="hidden md:block" />
              Just describe what you want and let our powerful search engine find it for you.
            </p>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
              <div className="relative">
                {}
                <div className="flex bg-white rounded-lg shadow-lg border border-gray-300 hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                  {}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Try: 'running shoes under ₹5000' or 'wireless headphones'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-14 px-6 text-gray-800 placeholder-gray-500 border-none outline-none focus:ring-0 text-lg bg-transparent"
                    />
                  </div>
                  {}
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 transition-colors duration-200 px-8 py-4 flex items-center justify-center text-white font-medium"
                    aria-label="Search"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
            {}
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                <div className="text-center group bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Smart Search</h3>
                  <p className="text-gray-600 text-xs">Use natural language to describe what you want. Our system understands context and finds exactly what you need.</p>
                </div>
                <div className="text-center group bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Review Analysis</h3>
                  <p className="text-gray-600 text-xs">Get instant insights from customer reviews with advanced analysis and sentiment detection.</p>
                </div>
                <div className="text-center group bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Lightning Fast</h3>
                  <p className="text-gray-600 text-xs">Advanced algorithms deliver instant results with real-time filtering and sorting options.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className="relative h-60 overflow-hidden">
        <div className="relative w-full h-full">
          {sliderImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{slide.title}</h2>
                  <p className="text-lg md:text-xl opacity-90">{slide.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>
      {}
      <section className="py-20 bg-white/70">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Shop by Category</h2>
            <p className="text-gray-600 text-base">Browse through our wide range of product categories</p>
          </div>
          {}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 min-w-max px-4">
              {categories.map((category) => (
                <div 
                  key={category.id || category.name} 
                  onClick={() => handleCategoryClick(category.name)}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 w-48 flex-shrink-0 cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors duration-200 text-sm">
                      {category.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home; 