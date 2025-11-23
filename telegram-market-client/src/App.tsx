import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { AuthProvider } from './context/AuthContext';
// Import Pages
import FeedPage from './pages/FeedPage';
import SellPage from './pages/SellPage';
import AdminPage from './pages/AdminPage';
import UserManagementPage from './pages/UserManagementPage';

// Import Components
import Navbar from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ToastContainer } from './components/Toast';

// Inner App Component - has access to AuthContext
function AppContent() {
  return (
    <BrowserRouter>
      {/* 
        Main Content Wrapper 
        pb-20 adds padding at the bottom so the fixed Navbar doesn't cover content 
      */}
      <div className="min-h-screen bg-gray-100 pb-20 text-gray-900">
        
        {/* Display authentication errors at the top */}
        <ErrorDisplay className="m-4" />
        
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Routes>

      </div>

      {/* Navbar sits outside Routes so it is always visible */}
      <Navbar />
      
      {/* Toast notifications */}
      <ToastContainer />
    </BrowserRouter>
  );
}

function App() {
  
  useEffect(() => {
    // Initialize Telegram SDK
    WebApp.ready();
    WebApp.expand(); 
    
    // Set the header color to match our app
    WebApp.setHeaderColor('#ffffff'); 
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;