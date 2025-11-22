import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { AuthProvider } from './context/AuthContext';
// Import Pages
import FeedPage from './pages/FeedPage';
import SellPage from './pages/SellPage';
import AdminPage from './pages/AdminPage';

// Import Components
import Navbar from './components/Navbar';

function App() {
  
  useEffect(() => {
    // Initialize Telegram SDK
    WebApp.ready();
    WebApp.expand(); 
    
    // Set the header color to match our app
    WebApp.setHeaderColor('#ffffff'); 
  }, []);

  return (
    <AuthProvider>
    <BrowserRouter>
      {/* 
        Main Content Wrapper 
        pb-20 adds padding at the bottom so the fixed Navbar doesn't cover content 
      */}
      <div className="min-h-screen bg-gray-100 pb-20 text-gray-900">
        
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>

      </div>

      {/* Navbar sits outside Routes so it is always visible */}
      <Navbar />
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;