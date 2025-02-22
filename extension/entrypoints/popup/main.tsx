import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Analysis from './views/Analysis.tsx';
import { BrowserRouter, Routes, Route } from 'react-router';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/popup.html" element={<App />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
