/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as Sentry from '@sentry/react';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
  console.log('[Sentry] Web SDK Initialized.');
}

const required = ['VITE_API_URL', 'VITE_ENV'];
const missing = required.filter(k => !import.meta.env[k]);
if (missing.length) {
  document.body.style.cssText = 'margin:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace';
  document.body.innerHTML = `<div style="color:#ff6b6b;max-width:500px;padding:2rem;border:1px solid #ff6b6b;border-radius:8px">
    <h2 style="margin:0 0 1rem">⚠ Missing environment variables</h2>
    <p>Create <code>apps/web/.env.local</code> and set:</p>
    <pre style="color:#ffa07a">${missing.join('\n')}</pre>
    <p style="margin-top:1rem;color:#888">See .env.example for all variables.</p>
  </div>`;
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker in production to enable offline mode
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[Service Worker] Registration failed:', err);
      });
  });
}

