import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReviewAnalyzer from './ReviewAnalyzer';
const ProductCard = ({ product }) => {
  const [showModal, setShowModal] = useState(false);
  const formattedReviews = product.reviews?.map(review => ({
    rating: review.rating || 5,
    text: review.content || review.title || 'No review text available',
    username: review.userName || 'Anonymous',
    date: review.createdAt || new Date().toISOString(),
    title: review.title || ''
  })) || [];
  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'unset';
  };
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);
  return (
    <>
      {}
      <div 
        className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group relative flex"
        onClick={openModal}
      >
        {}
        <div className="w-48 h-48 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {}
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          {}
          {product.stocks !== undefined && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                product.stocks > 0 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {product.stocks > 0 ? `In Stock` : 'Out of Stock'}
              </span>
            </div>
          )}
        </div>
        {}
        <div className="flex-1 p-4 flex flex-col justify-between">
          {}
          <div>
            {}
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 mb-2">
              {product.name}
            </h3>
            {}
            {product.averageRating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(product.averageRating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <span className="text-sm text-blue-600 font-medium underline cursor-pointer hover:text-blue-700">
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-medium">
                  Choice
                </span>
              </div>
            )}
            {}
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-3">
              {product.description || 'No description available.'}
            </p>
            {}
            {(product.material || product.size || product.gender) && (
              <div className="mb-3">
                <ul className="text-sm text-gray-700 space-y-1">
                  {product.material && (
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Material: {product.material}
                    </li>
                  )}
                  {product.size && (
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Size: {product.size}
                    </li>
                  )}
                  {product.gender && (
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      For: {product.gender}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.brand && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                  {product.category}
                </span>
              )}
              {product.color && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                  {product.color}
                </span>
              )}
            </div>
          </div>
          {}            <div className="flex items-end justify-between">
            {}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{product.price?.toFixed(2)}
                </span>
              </div>
              {}
              <div className="text-sm text-gray-600 mb-1">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>FREE delivery</span>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-medium">
                Match Score: {(() => {
                  const score = product._score || product.nlp_score || product.semantic_score;
                  const normalizedScore = Math.min(100, Math.max(0, (score / 30) * 100));
                  return normalizedScore.toFixed(0);
                })()}%
              </span>
            </div>
            {}
            <div className="flex flex-col gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openModal();
                }}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm min-w-[120px]"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
      {}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
            onClick={closeModal}
          ></div>
          {}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ${product.price?.toFixed(2)}
                  </span>
                  {product.averageRating && (
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400 text-sm">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(product.averageRating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {product.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({product.totalReviews || formattedReviews.length > 0 ? (product.totalReviews || formattedReviews.length) : ''} {product.totalReviews || formattedReviews.length > 0 ? 'reviews' : 'No reviews yet'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-4"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {}
            <div className="flex h-[calc(90vh-160px)]">
              {}
              <div className="w-[30%] bg-gray-50 border-r border-gray-200 overflow-y-auto">
                <div className="p-5 space-y-5">
                  {}
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed text-xs">
                      {product.description || 'No description available.'}
                    </p>
                  </div>
                  {}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Brand', value: product.brand },
                        { label: 'Category', value: product.category },
                        { label: 'Subcategory', value: product.subcategory },
                        { label: 'Color', value: product.color },
                        { label: 'Gender', value: product.gender },
                        { label: 'Material', value: product.material },
                        { label: 'Size', value: product.size },
                        { label: 'Stock', value: product.stocks }
                      ].map((item, index) => (
                        item.value && (
                          <div key={index} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
                            <span className="text-xs font-medium text-gray-600">{item.label}</span>
                            <span className="text-xs text-gray-900 font-semibold">{item.value}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  {}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.stocks > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`font-semibold text-xs ${product.stocks > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {product.stocks > 0 ? `${product.stocks} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {}
              <div className="w-[70%] bg-white overflow-y-auto">
                <div className="p-5 space-y-5">
                  {}
                  {formattedReviews.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        AI Review Analysis
                      </h2>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <ReviewAnalyzer reviews={formattedReviews} />
                      </div>
                    </div>
                  )}
                  {}
                  {formattedReviews.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          Customer Reviews
                        </h2>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          {formattedReviews.length} reviews
                        </span>
                      </div>
                      <div className="space-y-3">
                        {formattedReviews.map((review, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {review.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900 text-xs">{review.username}</h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(review.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-xs ${i < (review.rating || 5) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-gray-600">
                                    {review.rating || 5}/5
                                  </span>
                                </div>
                                {review.title && (
                                  <h5 className="font-semibold text-gray-800 mb-1 text-xs">{review.title}</h5>
                                )}
                                <p className="text-gray-700 leading-relaxed text-xs">{review.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">No Reviews Yet</h3>
                      <p className="text-gray-500 text-xs">Be the first to share your experience with this product!</p>
                    </div>
                  )}
                </div>
              </div>
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
    _score: PropTypes.number,
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