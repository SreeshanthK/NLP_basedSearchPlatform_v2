import { useState } from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div 
      className={`bg-white rounded-lg overflow-hidden transition-all duration-300 border border-gray-100 ${
        isHovered ? 'shadow-lg transform -translate-y-1' : 'shadow-sm'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {product.image && (
          <img 
            src={product.image} 
            alt={product.name} 
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-105' : ''
            }`}
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.brand && (
            <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold shadow-sm text-gray-700">
              {product.brand}
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.rating && (
            <div className="bg-white px-2 py-1 rounded-full text-sm font-semibold flex items-center shadow-sm">
              <span className="text-yellow-400 mr-1">★</span>
              <span className="text-gray-700">{product.rating}</span>
            </div>
          )}
          {product._score !== undefined && product._score !== null && (
            <div className="bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
              <span className="text-blue-700">Score: {product._score}</span>
            </div>
          )}
        </div>
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button 
              className="bg-white text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {product.category && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
              {product.category}
            </span>
          )}
          {product.gender && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
              {product.gender}
            </span>
          )}
          {product.color && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
              {product.color}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">{product.description}</p>
        
        {/* Extended details section */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="font-medium text-gray-800 mb-2">Product Details</h4>
            <ul className="text-sm space-y-1">
              {product.brand && <li><span className="font-medium">Brand:</span> {product.brand}</li>}
              {product.color && <li><span className="font-medium">Color:</span> {product.color}</li>}
              {product.gender && <li><span className="font-medium">Gender:</span> {product.gender}</li>}
              {product.material && <li><span className="font-medium">Material:</span> {product.material}</li>}
              {product.size && <li><span className="font-medium">Size:</span> {product.size}</li>}
              {product.stock && <li><span className="font-medium">In Stock:</span> {product.stock}</li>}
              {product.tags && product.tags.length > 0 && (
                <li>
                  <span className="font-medium">Tags:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              )}
              {product._score !== undefined && product._score !== null && (
                <li>
                  <span className="font-medium">NLP Score:</span>{' '}
                  <div className="text-xs text-gray-500 mt-0.5">Raw score: {product._score}</div>
                </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <button 
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isHovered 
                ? 'bg-blue-700 hover:bg-blue-800' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    category: PropTypes.string,
    rating: PropTypes.number,
    brand: PropTypes.string,
    color: PropTypes.string,
    gender: PropTypes.string,
    material: PropTypes.string,
    size: PropTypes.string,
    stock: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    _score: PropTypes.number // NLP relevance score
  }).isRequired,
};

export default ProductCard; 