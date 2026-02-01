import React, { useState } from 'react';
import { useSites } from '@/services/siteService';
import { getErrorMessage } from '@/utils/errorHandler';
import './SiteList.css';

/**
 * Loading skeleton component
 */
const LoadingSkeleton: React.FC = () => (
  <div className="skeleton">
    <div className="skeleton-item" />
    <div className="skeleton-item" />
    <div className="skeleton-item" />
  </div>
);

/**
 * Site list component with pagination
 *
 * Features:
 * - Real API integration using React Query
 * - Loading states
 * - Error handling with retry
 * - Pagination support
 * - Automatic refetch on mount
 *
 * Task 1.2 Implementation
 */
export const SiteList: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch sites using React Query
  const { data, isLoading, error, refetch } = useSites(page, pageSize);

  const errorMessage = error ? getErrorMessage(error) : null;

  const handleNextPage = () => {
    if (data?.pagination && page < data.pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="site-list-container">
      <div className="site-list-header">
        <h2>Sites Management</h2>
        <button onClick={handleRetry} className="btn btn-secondary" disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading && !data ? (
        <LoadingSkeleton />
      ) : errorMessage ? (
        <div className="error-container">
          <div className="error-message">
            <h3>Error Loading Sites</h3>
            <p>{errorMessage}</p>
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="site-grid">
            {data.data.map((site) => (
              <div key={site.id} className="site-card">
                <div className="site-card-header">
                  <h3>{site.name}</h3>
                  <span
                    className={`status-badge status-${site.status || 'active'}`}
                  >
                    {(site.status || 'active').toUpperCase()}
                  </span>
                </div>
                <div className="site-card-body">
                  <div className="site-info">
                    <span className="label">📍 Location:</span>
                    <span className="value">{site.location}</span>
                  </div>
                  <div className="site-info">
                    <span className="label">🌡️ Temperature:</span>
                    <span className="value">{site.temperature}°C</span>
                  </div>
                  <div className="site-info">
                    <span className="label">💧 Humidity:</span>
                    <span className="value">{site.humidity}%</span>
                  </div>
                  <div className="site-info">
                    <span className="label">🚨 Alarms:</span>
                    <span className="value">
                      {(site.alarmCount ?? 0) > 0 ? (
                        <span className="alarm-count">{site.alarmCount}</span>
                      ) : (
                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✓ None</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <div className="pagination-info">
              Page {page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </div>
            <button
              onClick={handleNextPage}
              disabled={page >= data.pagination.totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>No sites found</p>
        </div>
      )}
    </div>
  );
};

export default SiteList;
