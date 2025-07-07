import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const FilterSidebar = ({ onFilterChange, initialFilters = null }) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [categories, setCategories] = useState([]);
  const [ratings, setRatings] = useState([]);

  const categoryOptions = ['Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home & Kitchen', 'Books', 'Beauty', 'Toys'];
  const ratingOptions = [5, 4, 3, 2, 1];

  // Initialize filters from props if provided
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.priceRange) {
        setPriceRange(initialFilters.priceRange);
      }
      if (initialFilters.categories) {
        setCategories(initialFilters.categories);
      }
      if (initialFilters.ratings) {
        setRatings(initialFilters.ratings);
      }
    }
  }, [initialFilters]);

  // Construct the filters object
  const filters = {
    priceRange,
    categories,
    ratings
  };

  // Apply filters with debounce for price range
  const applyFilters = () => {
    console.log('Applying filters:', filters);
    onFilterChange(filters);
  };

  // Handle price range changes with validation
  const handlePriceChange = (e, type) => {
    const value = parseInt(e.target.value) || 0;
    
    // Ensure min doesn't exceed max and max is not less than min
    let newPriceRange;
    if (type === 'min') {
      const validMin = Math.min(value, priceRange.max);
      newPriceRange = { ...priceRange, min: validMin };
    } else {
      const validMax = Math.max(value, priceRange.min);
      newPriceRange = { ...priceRange, max: validMax };
    }
    
    setPriceRange(newPriceRange);
    
    // Apply filters after a short delay to prevent excessive API calls
    setTimeout(() => {
      onFilterChange({
        ...filters,
        priceRange: newPriceRange
      });
    }, 500);
  };

  const handleCategoryChange = (category) => {
    const newCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category];
    
    setCategories(newCategories);
    onFilterChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleRatingChange = (rating) => {
    const newRatings = ratings.includes(rating)
      ? ratings.filter(r => r !== rating)
      : [...ratings, rating];
    
    setRatings(newRatings);
    onFilterChange({
      ...filters,
      ratings: newRatings
    });
  };

  const clearAllFilters = () => {
    const resetFilters = {
      priceRange: { min: 0, max: 1000 },
      categories: [],
      ratings: []
    };
    
    setPriceRange(resetFilters.priceRange);
    setCategories(resetFilters.categories);
    setRatings(resetFilters.ratings);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {(categories.length > 0 || ratings.length > 0 || priceRange.min > 0 || priceRange.max < 1000) && (
          <button 
            onClick={clearAllFilters}
            className="text-blue-600 text-sm hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Price Range Filter */}
      <div className="mb-8">
        <h3 className="font-medium mb-4 text-gray-800">Price Range</h3>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => handlePriceChange(e, 'min')}
              className="w-full pl-7 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max={priceRange.max}
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceChange(e, 'max')}
              className="w-full pl-7 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={priceRange.min}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>${priceRange.min}</span>
          <span>${priceRange.max}</span>
        </div>
      </div>
      
      {/* Categories Filter */}
      <div className="mb-8">
        <h3 className="font-medium mb-4 text-gray-800">Categories</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {categoryOptions.map((category) => (
            <div key={category} className="flex items-center">
              <input
                type="checkbox"
                id={`category-${category}`}
                checked={categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`category-${category}`} className="text-gray-700 cursor-pointer">{category}</label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Ratings Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-4 text-gray-800">Customer Ratings</h3>
        <div className="space-y-3">
          {ratingOptions.map((rating) => (
            <div key={rating} className="flex items-center">
              <input
                type="checkbox"
                id={`rating-${rating}`}
                checked={ratings.includes(rating)}
                onChange={() => handleRatingChange(rating)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`rating-${rating}`} className="flex items-center text-gray-700 cursor-pointer">
                <span className="text-yellow-400 mr-1">{Array(rating).fill('★').join('')}</span>
                <span className="text-gray-300">{Array(5 - rating).fill('☆').join('')}</span>
                <span className="ml-1">{rating === 1 ? '& up' : `& up`}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FilterSidebar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  initialFilters: PropTypes.shape({
    priceRange: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    }),
    categories: PropTypes.array,
    ratings: PropTypes.array
  })
};

export default FilterSidebar; 