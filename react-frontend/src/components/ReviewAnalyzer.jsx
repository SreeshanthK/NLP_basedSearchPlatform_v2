import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { analyzeReviews } from '../services/api';

const ReviewAnalyzer = ({ reviews }) => {
  const [summary, setSummary] = useState('');
  const [categoryRatings, setCategoryRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categories to display
  const categories = [
    { id: 'quality', name: 'Quality' },
    { id: 'value', name: 'Value for Money' },
    { id: 'comfort', name: 'Comfort' },
    { id: 'appearance', name: 'Appearance' },
    { id: 'functionality', name: 'Functionality' }
  ];

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!reviews || reviews.length === 0) {
        setSummary('No reviews available to analyze.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Call backend API for analysis
        const analysisResult = await analyzeReviews(reviews);
        
        // Update state with analysis results
        setSummary(analysisResult.summary || 'Analysis completed.');
        setCategoryRatings(analysisResult.categoryRatings || {});
        
        setLoading(false);
      } catch (err) {
        console.error('Error analyzing reviews:', err);
        setError('Failed to analyze reviews');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [reviews]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-500 rounded-lg">
        No reviews available to analyze
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Review Summary</h4>
        <p className="text-gray-700">{summary}</p>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Category Ratings</h4>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.id} className="flex items-center">
              <span className="w-32 text-sm text-gray-600">{category.name}:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getRatingColor(categoryRatings[category.id] || 0)}`} 
                  style={{ width: `${((categoryRatings[category.id] || 0) / 5) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {categoryRatings[category.id]?.toFixed(1) || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color based on rating
const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'bg-green-500';
  if (rating >= 4) return 'bg-green-400';
  if (rating >= 3.5) return 'bg-green-300';
  if (rating >= 3) return 'bg-yellow-400';
  if (rating >= 2.5) return 'bg-yellow-500';
  if (rating >= 2) return 'bg-orange-400';
  return 'bg-red-500';
};

ReviewAnalyzer.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      rating: PropTypes.number,
      text: PropTypes.string,
      title: PropTypes.string,
      username: PropTypes.string,
      date: PropTypes.string
    })
  )
};

export default ReviewAnalyzer; 