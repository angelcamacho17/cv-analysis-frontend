/**
 * Job Positions Service
 * Handles all job position API operations
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api-client';
import type {
  JobPosition,
  JobPositionCreateRequest,
  JobPositionUpdateRequest,
  JobPositionListResponse,
  JobPositionResponse,
  JobPositionAnalyticsResponse,
  JobPositionAnalysesResponse,
} from '../types/job-positions';

/**
 * Create a new job position
 * @param positionData - Position details
 * @returns Created position
 */
export const createJobPosition = async (
  positionData: JobPositionCreateRequest
): Promise<JobPosition> => {
  const data = await apiPost<JobPositionResponse>('/job-positions', positionData);
  return data.position;
};

/**
 * Get all job positions
 * @param options - Query options
 * @returns List of positions
 */
export const getJobPositions = async (options?: {
  active?: boolean;
  page?: number;
  limit?: number;
}): Promise<JobPosition[]> => {
  const params = new URLSearchParams();

  if (options?.active !== undefined) {
    params.append('active', String(options.active));
  }
  if (options?.page) {
    params.append('page', String(options.page));
  }
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }

  const url = params.toString() ? `/job-positions?${params}` : '/job-positions';
  const data = await apiGet<JobPositionListResponse>(url);
  return data.positions;
};

/**
 * Get single job position by ID
 * @param positionId - Position ID
 * @returns Position details
 */
export const getJobPosition = async (positionId: number): Promise<JobPosition> => {
  const data = await apiGet<JobPositionResponse>(`/job-positions/${positionId}`);
  return data.position;
};

/**
 * Update job position
 * @param positionId - Position ID
 * @param updates - Fields to update
 * @returns Updated position
 */
export const updateJobPosition = async (
  positionId: number,
  updates: JobPositionUpdateRequest
): Promise<JobPosition> => {
  const data = await apiPatch<JobPositionResponse>(`/job-positions/${positionId}`, updates);
  return data.position;
};

/**
 * Delete job position
 * @param positionId - Position ID
 */
export const deleteJobPosition = async (positionId: number): Promise<void> => {
  await apiDelete(`/job-positions/${positionId}`);
};

/**
 * Duplicate job position
 * @param positionId - Position ID to duplicate
 * @param newTitle - Title for duplicated position
 * @returns New duplicated position
 */
export const duplicateJobPosition = async (
  positionId: number,
  newTitle: string
): Promise<JobPosition> => {
  const data = await apiPost<JobPositionResponse>(`/job-positions/${positionId}/duplicate`, { title: newTitle });
  return data.position;
};

/**
 * Get analytics for job position
 * @param positionId - Position ID
 * @returns Position analytics
 */
export const getPositionAnalytics = async (
  positionId: number
): Promise<JobPositionAnalyticsResponse> => {
  return apiGet<JobPositionAnalyticsResponse>(`/job-positions/${positionId}/analytics`);
};

/**
 * Get analyses for job position
 * @param positionId - Position ID
 * @param options - Pagination options
 * @returns Analyses and pagination
 */
export const getPositionAnalyses = async (
  positionId: number,
  options?: { page?: number; limit?: number }
): Promise<JobPositionAnalysesResponse> => {
  const params = new URLSearchParams();

  if (options?.page) {
    params.append('page', String(options.page));
  }
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }

  const url = params.toString()
    ? `/job-positions/${positionId}/analyses?${params}`
    : `/job-positions/${positionId}/analyses`;

  return apiGet<JobPositionAnalysesResponse>(url);
};
