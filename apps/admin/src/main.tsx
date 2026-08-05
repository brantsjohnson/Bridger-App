// ============================================
// WHAT THIS FILE DOES (plain English):
// Boots the admin console: mounts React, wraps everything in AuthProvider
// so login state is available on every page.
// ============================================
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element in index.html');
}

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
