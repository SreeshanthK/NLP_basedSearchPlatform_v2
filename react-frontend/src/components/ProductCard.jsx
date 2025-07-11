import { useState } from 'react';
import PropTypes from 'prop-types';
import ReviewDisplay from './ReviewDisplay';
import ReviewAnalyzer from './ReviewAnalyzer';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Format reviews to match ReviewDisplay component's expected format
  const formattedReviews = product.reviews?.map(review => ({
    rating: review.rating || 5,
    text: review.content || review.title || 'No review text available',
    username: review.userName || 'Anonymous',
    date: review.createdAt || new Date().toISOString(),
    title: review.title || ''
  })) || [];
  
  const handleViewAllReviews = () => {
    setShowReviewModal(true);
  };

  const closeModal = () => {
    setShowReviewModal(false);
  };
  
  return (
    <>
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
            {product.averageRating && (
              <div className="bg-white px-2 py-1 rounded-full text-sm font-semibold flex items-center shadow-sm">
                <span className="text-yellow-400 mr-1">★</span>
                <span className="text-gray-700">{product.averageRating.toFixed(1)}</span>
                {product.totalReviews > 0 && (
                  <span className="text-gray-500 text-xs ml-1">({product.totalReviews})</span>
                )}
              </div>
            )}
            {product._score !== undefined && product._score !== null && (
              <div className="bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
                <span className="text-blue-700">Score: {product._score.toFixed(2)}</span>
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
                {product.stocks !== undefined && <li><span className="font-medium">In Stock:</span> {product.stocks}</li>}
                {product.totalReviews > 0 && (
                  <li>
                    <span className="font-medium">Reviews:</span> {product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'}
                  </li>
                )}
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
                    <div className="text-xs text-gray-500 mt-0.5">Raw score: {product._score.toFixed(2)}</div>
                  </li>
                )}
                
                {/* Reviews section */}
                {formattedReviews.length > 0 && (
                  <li className="mt-4">
                    <span className="font-medium text-base">Reviews</span>
                    <div className="mt-2">
                      <ReviewDisplay 
                        reviews={formattedReviews} 
                        maxDisplayed={2} 
                        onViewAllClick={handleViewAllReviews}
                      />
                    </div>
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Product Details & Reviews</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={closeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Information */}
                <div>
                  <div className="mb-4">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h3>
                  
                  <div className="flex items-center mb-4">
                    {product.averageRating && (
                      <div className="flex items-center mr-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-gray-700">{product.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    {product.totalReviews > 0 && (
                      <span className="text-gray-600">{product.totalReviews} reviews</span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Product Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {product.brand && (
                        <div>
                          <span className="font-medium">Brand:</span> {product.brand}
                        </div>
                      )}
                      {product.category && (
                        <div>
                          <span className="font-medium">Category:</span> {product.category}
                        </div>
                      )}
                      {product.subcategory && (
                        <div>
                          <span className="font-medium">Subcategory:</span> {product.subcategory}
                        </div>
                      )}
                      {product.color && (
                        <div>
                          <span className="font-medium">Color:</span> {product.color}
                        </div>
                      )}
                      {product.gender && (
                        <div>
                          <span className="font-medium">Gender:</span> {product.gender}
                        </div>
                      )}
                      {product.material && (
                        <div>
                          <span className="font-medium">Material:</span> {product.material}
                        </div>
                      )}
                      {product.size && (
                        <div>
                          <span className="font-medium">Size:</span> {product.size}
                        </div>
                      )}
                      {product.stocks !== undefined && (
                        <div>
                          <span className="font-medium">In Stock:</span> {product.stocks}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
                
                {/* Reviews Section */}
                <div>
                  {/* Review Analysis Section */}
                  {formattedReviews.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        AI Review Analysis
                      </h3>
                      <ReviewAnalyzer reviews={formattedReviews} />
                    </div>
                  )}
                
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Customer Reviews ({product.totalReviews || 0})
                  </h3>
                  
                  {formattedReviews.length > 0 ? (
                    <div className="space-y-6">
                      {formattedReviews.map((review, index) => (
                        <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < (review.rating || 5) ? "text-yellow-400" : "text-gray-300"}>★</span>
                                ))}
                              </div>
                              <span className="ml-2 font-medium text-gray-700">
                                {review.username || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.date ? new Date(review.date).toLocaleDateString() : 'Recent review'}
                            </span>
                          </div>
                          
                          {review.title && (
                            <h4 className="font-medium text-gray-800 mb-1">{review.title}</h4>
                          )}
                          
                          <p className="text-gray-700">{review.text || 'No review text available'}</p>
                          
                          {review.pros && (
                            <div className="mt-2">
                              <span className="text-green-600 font-medium text-sm">Pros:</span>
                              <p className="text-sm text-gray-600">{review.pros}</p>
                            </div>
                          )}
                          
                          {review.cons && (
                            <div className="mt-2">
                              <span className="text-red-600 font-medium text-sm">Cons:</span>
                              <p className="text-sm text-gray-600">{review.cons}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded">
                      <p className="text-gray-500">No reviews available for this product</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t">
              <button 
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    category: PropTypes.string,
    subcategory: PropTypes.string,
    averageRating: PropTypes.number,
    brand: PropTypes.string,
    color: PropTypes.string,
    gender: PropTypes.string,
    material: PropTypes.string,
    size: PropTypes.string,
    stocks: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    _score: PropTypes.number, // NLP relevance score
    totalReviews: PropTypes.number,
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        productId: PropTypes.string,
        userName: PropTypes.string,
        rating: PropTypes.number,
        content: PropTypes.string,
        title: PropTypes.string,
        createdAt: PropTypes.string,
        updatedAt: PropTypes.string
      })
    )
  }).isRequired,
};

export default ProductCard; 