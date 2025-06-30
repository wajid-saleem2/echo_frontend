// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind CSS
import App from './App';
// No need to import AuthProvider here if App.js already wraps its content with it.
// If you prefer to wrap here:
// import { AuthProvider } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext'; // <<<< IMPORT
import { initGA } from './services/analytics'; // Import initGA

initGA(); // Initialize GA

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* If AuthProvider is not in App.js, wrap here:
    <AuthProvider>
      <App />
    </AuthProvider>
    */}
      <HelmetProvider>
      <ThemeProvider> 
    <App />
    </ThemeProvider>
      </HelmetProvider>
  </React.StrictMode>
);