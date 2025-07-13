import PropTypes from 'prop-types';
const ReviewDisplay = ({ reviews, maxDisplayed = 3, onViewAllClick }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded">
        <p className="text-gray-500">No reviews available for this product</p>
      </div>
    );
  }
  const displayedReviews = reviews.slice(0, maxDisplayed);
  const hasMoreReviews = reviews.length > maxDisplayed;
  return (
    <div className="space-y-4">
      {displayedReviews.map((review, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded">
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
      {hasMoreReviews && (
        <div className="text-center mt-4">
          <button 
            className="text-blue-600 hover:text-blue-800 font-medium"
            onClick={onViewAllClick}
          >
            View all {reviews.length} reviews
          </button>
        </div>
      )}
    </div>
  );
};
ReviewDisplay.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      rating: PropTypes.number,
      text: PropTypes.string,
      username: PropTypes.string,
      date: PropTypes.string,
      title: PropTypes.string,
      pros: PropTypes.string,
      cons: PropTypes.string
    })
  ),
  maxDisplayed: PropTypes.number,
  onViewAllClick: PropTypes.func
};
export default ReviewDisplay; 