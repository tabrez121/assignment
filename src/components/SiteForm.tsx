import React, { useState } from 'react';
import { Site } from '@/types';
import { useUpdateSite } from '@/services/siteService';
import { getErrorMessage, isRetryable } from '@/utils/errorHandler';
import './SiteForm.css';

/**
 * Props for SiteForm component
 */
interface SiteFormProps {
  site: Site;
  onSuccess?: () => void;
}

/**
 * Site form component with optimistic updates
 *
 * Features:
 * - Optimistic UI updates
 * - Loading states during submission
 * - Error handling with rollback
 * - Retry capability for transient errors
 * - Success feedback
 *
 * Task 3.2 Implementation
 */
export const SiteForm: React.FC<SiteFormProps> = ({ site, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: site.name,
    capacity: site.capacity,
    location: site.location || '',
    status: site.status || 'active',
  });

  const [optimisticSite, setOptimisticSite] = useState<Site | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutate: updateSite, isPending } = useUpdateSite();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);
    setSubmitError(null);

    // Create optimistic update
    const optimisticUpdated: Site = {
      ...site,
      ...formData,
    };

    // Update UI optimistically
    setOptimisticSite(optimisticUpdated);

    try {
      // Attempt API update
      updateSite(
        { id: site.id, data: formData },
        {
          onSuccess: () => {
            setOptimisticSite(null);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
            onSuccess?.();
          },
          onError: (error) => {
            // Revert optimistic update
            setOptimisticSite(null);

            const errorMessage = getErrorMessage(error);
            setSubmitError(errorMessage);

            // Log error details
            console.error('Failed to update site:', {
              error,
              isRetryable: isRetryable(error),
              formData,
            });
          },
        }
      );
    } catch (err) {
      setOptimisticSite(null);
      const errorMessage = getErrorMessage(err);
      setSubmitError(errorMessage);
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
  };

  const displaySite = optimisticSite || site;

  return (
    <div className="site-form-container">
      <h3>Edit Site</h3>

      {submitted && (
        <div className="alert alert-success">
          ✓ Site updated successfully!
        </div>
      )}

      {submitError && (
        <div className="alert alert-error">
          <div className="alert-content">
            <strong>Error:</strong> {submitError}
          </div>
          {isRetryable(submitError) && (
            <button onClick={handleRetry} className="btn btn-small btn-primary">
              Retry
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="site-form">
        <div className="form-group">
          <label htmlFor="name">Site Name *</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isPending}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="capacity">Capacity (units) *</label>
          <input
            id="capacity"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            disabled={isPending}
            required
            min="1"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={isPending}
            className="form-input"
            placeholder="e.g., San Francisco, CA"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isPending}
            className="form-select"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {optimisticSite && (
          <div className="optimistic-indicator">
            <span className="spinner" />
            Updating locally... (syncing with server)
          </div>
        )}
      </form>

      <div className="site-display">
        <h4>Current Values</h4>
        <div className="value-row">
          <span className="label">Name:</span>
          <span className="value">{displaySite.name}</span>
        </div>
        <div className="value-row">
          <span className="label">Capacity:</span>
          <span className="value">{displaySite.capacity} units</span>
        </div>
        {displaySite.location && (
          <div className="value-row">
            <span className="label">Location:</span>
            <span className="value">{displaySite.location}</span>
          </div>
        )}
        <div className="value-row">
          <span className="label">Status:</span>
          <span className="value">
            <span className={`status-badge status-${displaySite.status}`}>
              {(displaySite.status || 'active').toUpperCase()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SiteForm;
