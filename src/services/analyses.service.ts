/**
 * Analyses Service
 * Manages stored analyses and candidate search
 * Extracted from Angular mv-admin project
 */

import { apiGet } from './api-client';
import {
  transformStatistics,
  transformCandidate,
  transformAnalysisSummary,
  transformAnalysisDetail,
} from '../utils/analyses-transformer';
import type {
  AnalysesListResponse,
  AnalysisDetailResponse,
  CandidateSearchParams,
  CandidateSearchResponse,
  StatisticsResponse,
  CandidateDetail,
} from '../types/analyses';

/**
 * Gets paginated list of all analyses
 */
export const getAnalyses = async (
  page: number = 1,
  limit: number = 10
): Promise<AnalysesListResponse> => {
  const response = await apiGet<any>(`/analyses?page=${page}&limit=${limit}`);

  // Transform snake_case backend response to camelCase frontend format
  return {
    success: response.success,
    data: response.analyses.map(transformAnalysisSummary),
    pagination: response.pagination,
  };
};

/**
 * Gets full details of a specific analysis
 */
export const getAnalysisDetail = async (id: string): Promise<AnalysisDetailResponse> => {
  const response = await apiGet<any>(`/analyses/${id}`);

  // Transform snake_case backend response to camelCase frontend format
  return {
    success: response.success,
    data: transformAnalysisDetail(response),
  };
};

/**
 * Searches candidates across all analyses with filters
 */
export const searchCandidates = async (
  params: CandidateSearchParams
): Promise<CandidateSearchResponse> => {
  const queryParams = new URLSearchParams();

  if (params.name) queryParams.append('name', params.name);
  if (params.email) queryParams.append('email', params.email);
  if (params.minScore !== undefined) queryParams.append('minScore', params.minScore.toString());
  if (params.maxScore !== undefined) queryParams.append('maxScore', params.maxScore.toString());
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.analysisId) queryParams.append('analysisId', params.analysisId);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await apiGet<any>(`/candidates/search?${queryParams.toString()}`);

  // Transform snake_case backend response to camelCase frontend format
  return {
    success: response.success,
    data: (response.candidates || response.data || []).map(transformCandidate),
    total: response.total || response.count || 0,
  };
};

/**
 * Gets top-scoring candidates across all analyses
 */
export const getTopCandidates = async (limit: number = 10): Promise<CandidateDetail[]> => {
  const response = await apiGet<any>(`/candidates/top?limit=${limit}`);
  const candidates = response.candidates || response.data || [];

  // Transform snake_case backend response to camelCase frontend format
  return candidates.map(transformCandidate);
};

/**
 * Gets global statistics
 */
export const getStatistics = async (): Promise<StatisticsResponse> => {
  const response = await apiGet<any>('/statistics');

  // Transform snake_case backend response to camelCase frontend format
  return {
    success: response.success,
    data: transformStatistics(response),
  };
};
