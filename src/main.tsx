import ReactDOM from 'react-dom/client';
import { App } from './App';

import '@styles/globals.css.ts';
import React from 'react';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element "#root" is missing in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
