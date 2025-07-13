import { Link } from 'react-router-dom';
const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </Link>
          {}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-200 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link 
              to="/search" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-200 relative group"
            >
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-200"></span>
            </Link>
          </div>
          {}
          <div className="md:hidden">
            <Link 
              to="/search" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors duration-200"
            >
              Products
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar; 