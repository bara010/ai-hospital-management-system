import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('[SW] Registered'))
    .catch(err => console.warn('[SW] Failed:', err));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
