import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
const FilterSidebar = ({ onFilterChange, initialFilters = null }) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [categories, setCategories] = useState([]);
  const [ratings, setRatings] = useState([]);
  const categoryOptions = ['Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home & Kitchen', 'Books', 'Beauty', 'Toys'];
  const ratingOptions = [5, 4, 3, 2, 1];
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
  const filters = {
    priceRange,
    categories,
    ratings
  };
  const applyFilters = () => {
    console.log('Applying filters:', filters);
    onFilterChange(filters);
  };
  const handlePriceChange = (e, type) => {
    const value = parseInt(e.target.value) || 0;
    let newPriceRange;
    if (type === 'min') {
      const validMin = Math.min(value, priceRange.max);
      newPriceRange = { ...priceRange, min: validMin };
    } else {
      const validMax = Math.max(value, priceRange.min);
      newPriceRange = { ...priceRange, max: validMax };
    }
    setPriceRange(newPriceRange);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        {(categories.length > 0 || ratings.length > 0 || priceRange.min > 0 || priceRange.max < 1000) && (
          <button 
            onClick={clearAllFilters}
            className="text-blue-600 text-sm hover:text-blue-800 font-medium transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>
      {}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Price Range
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => handlePriceChange(e, 'min')}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              min="0"
              max={priceRange.max}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceChange(e, 'max')}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              min={priceRange.min}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>${priceRange.min}</span>
          <span>${priceRange.max}</span>
        </div>
      </div>
      {}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Categories
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {categoryOptions.map((category) => (
            <label key={category} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <span className="ml-3 text-gray-700 font-medium">{category}</span>
            </label>
          ))}
        </div>
      </div>
      {}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Customer Ratings
        </h3>
        <div className="space-y-2">
          {ratingOptions.map((rating) => (
            <label key={rating} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
              <input
                type="checkbox"
                checked={ratings.includes(rating)}
                onChange={() => handleRatingChange(rating)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <div className="ml-3 flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {Array(rating).fill('★').join('')}
                  <span className="text-gray-300">{Array(5 - rating).fill('☆').join('')}</span>
                </div>
                <span className="text-gray-700 font-medium">{rating === 1 ? '& up' : `& up`}</span>
              </div>
            </label>
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