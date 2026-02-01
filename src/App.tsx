import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SiteList from '@/components/SiteList';
import AlarmList from '@/components/AlarmList';
import './App.css';

/**
 * Create React Query client
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Error fallback component
 */
const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="error-page">
    <div className="error-content">
      <h1>Oops! Something went wrong</h1>
      <p className="error-message">{error.message}</p>
      <button onClick={retry} className="btn btn-primary">
        Try Again
      </button>
    </div>
  </div>
);

/**
 * Main App component
 *
 * Features:
 * - React Query integration for data management
 * - Error boundary for catching React errors
 * - Site management interface
 * - Real-time alarm monitoring
 * - Comprehensive error handling
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={(error, retry) => <ErrorFallback error={error} retry={retry} />}>
        <div className="app">
          <header className="app-header">
            <div className="app-header-content">
              <div>
                <h1>🚀 ClearSpot.ai</h1>
                <p className="app-header-subtitle">Real-time Site & Alarm Monitoring Platform</p>
              </div>
              <div className="app-header-actions">
                <span style={{ fontSize: '12px', opacity: 0.9 }}>Frontend Assessment - Stage 2</span>
              </div>
            </div>
          </header>

          <main className="app-main">
            <div className="app-grid">
              <section>
                <SiteList />
              </section>
              <section>
                <AlarmList />
              </section>
            </div>
          </main>

          <footer style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: 'var(--text-secondary)',
            fontSize: '12px',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'auto'
          }}>
            <p>Built with React 18 • TypeScript • React Query • WebSocket • Vite</p>
          </footer>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
