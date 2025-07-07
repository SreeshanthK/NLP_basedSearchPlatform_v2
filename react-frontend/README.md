# E-Commerce Search Platform Frontend

This is the React frontend for the NLP-based E-Commerce Search Platform. It provides a user interface for browsing and searching products using the NLP search capabilities of the Express backend.

## Features

- Home page with featured products
- Search page with NLP-based search functionality
- Product filtering by price, category, and ratings
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

## Backend Connection

The frontend is configured to connect to the Express backend running on `http://localhost:3000`. Make sure the backend server is running before using the search functionality.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production-ready application
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview the production build locally

## Technologies Used

- React
- React Router
- Axios
- Tailwind CSS
- Vite
