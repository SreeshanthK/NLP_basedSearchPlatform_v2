import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
const SearchBar = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto">
      <div className="relative">
        {}
        <div className="flex bg-white rounded-lg shadow-md border border-gray-300 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          {}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for products, brands and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 px-4 text-gray-800 placeholder-gray-500 border-none outline-none focus:ring-0 text-base bg-transparent"
            />
          </div>
          {}
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 transition-colors duration-200 px-6 py-3 flex items-center justify-center text-white font-medium"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        {}
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden">
          {}
        </div>
      </div>
    </form>
  );
};
SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  initialQuery: PropTypes.string
};
export default SearchBar; 