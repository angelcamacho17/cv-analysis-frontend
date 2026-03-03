/**
 * Analyses Service
 * Manages stored analyses and candidate search
 * Extracted from Angular mv-admin project
 */

import { apiGet } from './api-client';
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
  return apiGet<AnalysesListResponse>(`/analyses?page=${page}&limit=${limit}`);
};

/**
 * Gets full details of a specific analysis
 */
export const getAnalysisDetail = async (id: string): Promise<AnalysisDetailResponse> => {
  return apiGet<AnalysisDetailResponse>(`/analyses/${id}`);
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

  return apiGet<CandidateSearchResponse>(`/candidates/search?${queryParams.toString()}`);
};

/**
 * Gets top-scoring candidates across all analyses
 */
export const getTopCandidates = async (limit: number = 10): Promise<CandidateDetail[]> => {
  const data = await apiGet<any>(`/candidates/top?limit=${limit}`);
  return data.data || data;
};

/**
 * Gets global statistics
 */
export const getStatistics = async (): Promise<StatisticsResponse> => {
  return apiGet<StatisticsResponse>('/statistics');
};
