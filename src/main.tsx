import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
// The imported gallery is authored as static HTML in index.html. Keep it
// visible instead of replacing it with the placeholder App component.
if (root && root.childElementCount === 0) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
