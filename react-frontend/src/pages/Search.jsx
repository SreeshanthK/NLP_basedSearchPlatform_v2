import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import { searchProducts } from '../services/api';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 1000 },
    categories: [],
    ratings: []
  });
  const [activeSearch, setActiveSearch] = useState('');

  // Get initial query and filters from URL params
  useEffect(() => {
    const initialQuery = searchParams.get('query');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const rating = searchParams.get('rating');
    
    // Build initial filters from URL params
    const initialFilters = { ...filters };
    
    if (category) {
      initialFilters.categories = [category];
    }
    
    if (minPrice || maxPrice) {
      initialFilters.priceRange = {
        min: minPrice ? parseInt(minPrice) : 0,
        max: maxPrice ? parseInt(maxPrice) : 1000
      };
    }
    
    if (rating) {
      initialFilters.ratings = [parseInt(rating)];
    }
    
    setFilters(initialFilters);
    
    if (initialQuery) {
      setActiveSearch(initialQuery);
      performSearch(initialQuery, initialFilters);
    }
  }, [searchParams]);

  // Separate search execution from the handler to avoid duplication
  const performSearch = async (query, currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Performing search with query:', query);
      console.log('Using filters:', currentFilters);
      
      const data = await searchProducts(query, currentFilters);
      setSearchResults(data);
    } catch (err) {
      setError('Failed to search products. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setActiveSearch(query);
    
    // Update URL with search query while preserving filter params
    const newParams = { query };
    
    // Add filter parameters to URL
    if (filters.categories && filters.categories.length > 0) {
      newParams.category = filters.categories[0];
    }
    
    if (filters.priceRange?.min > 0) {
      newParams.min_price = filters.priceRange.min.toString();
    }
    
    if (filters.priceRange?.max < 1000) {
      newParams.max_price = filters.priceRange.max.toString();
    }
    
    if (filters.ratings && filters.ratings.length > 0) {
      newParams.rating = Math.min(...filters.ratings).toString();
    }
    
    setSearchParams(newParams);
    performSearch(query, filters);
  };

  const handleFilterChange = (newFilters) => {
    console.log('Filter changed:', newFilters);
    setFilters(newFilters);
    
    // Update URL with filter parameters
    const newParams = { ...Object.fromEntries(searchParams) };
    
    // Update category parameter
    if (newFilters.categories && newFilters.categories.length > 0) {
      newParams.category = newFilters.categories[0];
    } else {
      delete newParams.category;
    }
    
    // Update price range parameters
    if (newFilters.priceRange?.min > 0) {
      newParams.min_price = newFilters.priceRange.min.toString();
    } else {
      delete newParams.min_price;
    }
    
    if (newFilters.priceRange?.max < 1000) {
      newParams.max_price = newFilters.priceRange.max.toString();
    } else {
      delete newParams.max_price;
    }
    
    // Update rating parameter
    if (newFilters.ratings && newFilters.ratings.length > 0) {
      newParams.rating = Math.min(...newFilters.ratings).toString();
    } else {
      delete newParams.rating;
    }
    
    setSearchParams(newParams);
    
    // If we already have an active search, apply the filters
    if (activeSearch) {
      performSearch(activeSearch, newFilters);
    }
  };

  return (
    <div className="w-full bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Search Products</h1>
        
        <SearchBar onSearch={handleSearch} initialQuery={searchParams.get('query') || ''} />
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <div className="sticky top-4">
              <FilterSidebar onFilterChange={handleFilterChange} initialFilters={filters} />
            </div>
          </div>
          
          <div className="w-full md:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="mb-4">{error}</p>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => activeSearch && handleSearch(activeSearch)}
                >
                  Try Again
                </button>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-700">
                    Found <span className="font-semibold">{searchResults.length}</span> results for 
                    <span className="font-semibold"> "{activeSearch}"</span>
                    {(filters.categories.length > 0 || 
                      filters.ratings.length > 0 || 
                      filters.priceRange.min > 0 || 
                      filters.priceRange.max < 1000) && (
                      <span className="text-gray-500"> (filtered)</span>
                    )}
                  </p>
                  
                  {/* Active filters display */}
                  {(filters.categories.length > 0 || 
                    filters.ratings.length > 0 || 
                    filters.priceRange.min > 0 || 
                    filters.priceRange.max < 1000) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.categories.map(category => (
                        <span key={category} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Category: {category}
                        </span>
                      ))}
                      
                      {filters.ratings.length > 0 && (
                        <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full">
                          Rating: {Math.min(...filters.ratings)}+ stars
                        </span>
                      )}
                      
                      {(filters.priceRange.min > 0 || filters.priceRange.max < 1000) && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                          Price: ${filters.priceRange.min} - ${filters.priceRange.max}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : activeSearch ? (
              <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500 mb-4">
                  No products found for "{activeSearch}"
                </p>
                <p className="text-gray-500">
                  Try a different search term or adjust your filters
                </p>
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">
                  Enter a search term above to find products
                </p>
                <p className="text-gray-500 mt-2">
                  Try phrases like "red shoes under $100" or "high-rated smartphones"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search; 