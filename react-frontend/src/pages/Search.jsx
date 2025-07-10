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
  const [totalResults, setTotalResults] = useState(0);
  const [searchMethods, setSearchMethods] = useState({});

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
      
      const response = await searchProducts(query, currentFilters);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setSearchResults(response);
        setTotalResults(response.length);
        setSearchMethods({});
      } else if (response && typeof response === 'object') {
        if (response.products && Array.isArray(response.products)) {
          setSearchResults(response.products);
          setTotalResults(response.totalResults || response.products.length);
          setSearchMethods(response.searchMethods || {});
        } else {
          setSearchResults([]);
          setTotalResults(0);
          setSearchMethods({});
        }
      }
    } catch (err) {
      setError('Failed to search products. Please try again later.');
      console.error(err);
      setSearchResults([]);
      setTotalResults(0);
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
    setFilters(newFilters);
    if (activeSearch) {
      performSearch(activeSearch, newFilters);
    }
  };

  // Get search method information for display
  const getSearchMethodInfo = () => {
    const methods = [];
    
    if (searchMethods.vector) methods.push('Vector');
    if (searchMethods.elasticsearch) methods.push('Elasticsearch');
    if (searchMethods.mongodb) methods.push('MongoDB');
    if (searchMethods.fallback) methods.push('Fallback');
    
    return methods.length > 0 ? methods.join(', ') : 'Standard';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <SearchBar 
          initialQuery={activeSearch} 
          onSearch={handleSearch} 
        />
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4 lg:w-1/5">
          <FilterSidebar 
            filters={filters}
            onFilterChange={handleFilterChange}
            searchResults={searchResults}
          />
        </div>
        
        <div className="w-full md:w-3/4 lg:w-4/5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {searchResults.length > 0 
                    ? `${totalResults} results for "${activeSearch}"`
                    : `No results found for "${activeSearch}"`
                  }
                </h2>
                {searchResults.length > 0 && (
                  <p className="text-gray-500 text-sm mt-1">
                    Showing products sorted by relevance • Search methods: {getSearchMethodInfo()}
                  </p>
                )}
              </div>
              
              {searchResults.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                  <button 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => {
                      setFilters({
                        priceRange: { min: 0, max: 1000 },
                        categories: [],
                        ratings: []
                      });
                      if (activeSearch) {
                        performSearch(activeSearch, {
                          priceRange: { min: 0, max: 1000 },
                          categories: [],
                          ratings: []
                        });
                      }
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 