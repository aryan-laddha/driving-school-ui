// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// 1. 👈 IMPORT THE AUTH PROVIDER
import { AuthProvider } from './context/AuthContext'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 2. 👈 WRAP THE ENTIRE APPLICATION WITH AuthProvider */}
      {/* This ensures that all components, including your UserSchedulePage, 
          can correctly access the authentication context. */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);