import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Site, PaginatedResponse } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

/**
 * Query keys for React Query
 */
export const siteQueryKeys = {
  all: ['sites'] as const,
  lists: () => [...siteQueryKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...siteQueryKeys.lists(), { page, limit }] as const,
  details: () => [...siteQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...siteQueryKeys.details(), id] as const,
};

/**
 * Fetch sites from API with pagination
 */
const fetchSites = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Site>> => {
  return apiClient.get<PaginatedResponse<Site>>('/sites', {
    params: { page, limit },
  });
};

/**
 * Hook to fetch paginated sites
 *
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Query result with sites and metadata
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useSites(1, 10);
 * ```
 */
export const useSites = (
  page: number = 1,
  limit: number = 10
): UseQueryResult<PaginatedResponse<Site>, Error> => {
  return useQuery({
    queryKey: siteQueryKeys.list(page, limit),
    queryFn: () => fetchSites(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch single site by ID
 */
const fetchSiteById = async (id: string): Promise<Site> => {
  return apiClient.get<Site>(`/sites/${id}`);
};

/**
 * Hook to fetch a single site by ID
 */
export const useSiteById = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? siteQueryKeys.detail(id) : ['disabled'],
    queryFn: () => (id ? fetchSiteById(id) : Promise.reject('No ID provided')),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

/**
 * Create new site mutation
 */
const createSite = async (data: Omit<Site, 'id'>): Promise<Site> => {
  return apiClient.post<Site>('/sites', data);
};

/**
 * Hook to create a new site
 */
export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSite,
    onSuccess: (newSite) => {
      // Invalidate sites list to refetch
      queryClient.invalidateQueries({ queryKey: siteQueryKeys.lists() });

      // Optionally add to cache
      queryClient.setQueryData(siteQueryKeys.detail(newSite.id), newSite);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Failed to create site:', message);
    },
  });
};

/**
 * Update site mutation
 */
const updateSite = async (id: string, data: Partial<Site>): Promise<Site> => {
  return apiClient.put<Site>(`/sites/${id}`, data);
};

/**
 * Hook to update a site
 */
export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Site> }) => updateSite(id, data),
    onSuccess: (updatedSite) => {
      // Update cache
      queryClient.setQueryData(siteQueryKeys.detail(updatedSite.id), updatedSite);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: siteQueryKeys.lists() });
    },
  });
};

/**
 * Delete site mutation
 */
const deleteSiteAPI = async (id: string): Promise<void> => {
  return apiClient.delete(`/sites/${id}`);
};

/**
 * Hook to delete a site
 */
export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSiteAPI,
    onSuccess: () => {
      // Invalidate all sites queries
      queryClient.invalidateQueries({ queryKey: siteQueryKeys.all });
    },
  });
};
