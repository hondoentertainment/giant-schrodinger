import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initSentry, isSentryInitialized, Sentry } from './services/errorMonitoring';
import { initPosthogAnalytics } from './services/analytics';

// Initialize monitoring + analytics BEFORE React renders so that any errors
// thrown during the first render are captured. Both inits are no-ops if
// their respective env vars are missing, so dev environments without keys
// keep working unchanged.
initSentry();
initPosthogAnalytics();

// Minimal fallback shown if the Sentry error boundary catches a crash during
// render. We intentionally keep this simple and self-contained so it can't
// itself be the source of a render error.
function SentryFallback() {
  return (
    <div
      role="alert"
      style={{
        padding: '2rem',
        color: '#e9d5ff',
        background: '#0b0618',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
      <p>The error has been reported. Please refresh to try again.</p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Only wrap in Sentry.ErrorBoundary when Sentry is actually initialized —
// otherwise render normally and let the existing in-app ErrorBoundary
// (inside App.jsx) handle render errors.
const tree = isSentryInitialized() ? (
  <Sentry.ErrorBoundary fallback={<SentryFallback />}>
    <App />
  </Sentry.ErrorBoundary>
) : (
  <App />
);

root.render(<React.StrictMode>{tree}</React.StrictMode>);
