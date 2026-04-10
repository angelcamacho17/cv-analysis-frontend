/**
 * Stored Analyses Types
 * Extracted from Angular mv-admin project
 */

import type { CandidateCategory } from './cv-analysis';

// Re-export CandidateCategory for convenience
export type { CandidateCategory };

export interface AnalysisSummaryItem {
  id: string;
  excelFilename: string;
  analysisDate: string;
  totalCandidates: number;
  paraEntrevistar: number;
  quizas: number;
  descartados: number;
  cvsProcessed: number;
  errors: number;
  jobPositionId?: number | null;
  jobPositionTitle?: string;
}

export interface AnalysesListResponse {
  success: boolean;
  data: AnalysisSummaryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CandidateDetail {
  id?: string;
  analysisId?: string;
  nombre: string;
  email: string;
  telefono: string;
  phone?: string;
  score: number;
  categoria: CandidateCategory;
  category?: CandidateCategory;
  fortalezaPrincipal: string;
  mainStrength?: string;
  banderaRoja: string;
  redFlag?: string;
  fortalezas?: string[];
  strengths?: string[];
  areasAtencion?: string[];
  areasOfAttention?: string[];
  consistencia?: string;
  consistency?: string;
  preguntaSugerida?: string;
  suggestedQuestion?: string;
  razonInteres?: string;
  reasonOfInterest?: string;
  habilidades?: string;
  skills?: string;
  descripcionAmigos?: string;
  friendsDescription?: string;
  porQueContratarme?: string;
  whyHireMe?: string;
}

export interface AnalysisMetadata {
  totalCandidates: number;
  cvsProcessed: number;
  errors: number;
  promptSize: number;
  fileHash: string;
}

export interface AnalysisDetail {
  id: string;
  excelFilename: string;
  analysisDate: string;
  jobPositionId?: number | null;
  jobPositionTitle?: string;
  summary: {
    totalAnalizados: number;
    paraEntrevistar: number;
    quizas: number;
    descartados: number;
    top3: CandidateDetail[];
  };
  candidates: CandidateDetail[];
  metadata: AnalysisMetadata;
}

export interface AnalysisDetailResponse {
  success: boolean;
  data: AnalysisDetail;
}

export interface CandidateSearchParams {
  name?: string;
  email?: string;
  minScore?: number;
  maxScore?: number;
  category?: CandidateCategory | 'all';
  analysisId?: string;
  jobPositionId?: number;
  limit?: number;
}

export interface CandidateSearchResponse {
  success: boolean;
  data: CandidateDetail[];
  total: number;
}

export interface Statistics {
  totalAnalyses: number;
  totalCandidates: number;
  candidatesToInterview: number;
  averageScore: number;
  categoryDistribution: {
    entrevistar: number;
    quizas: number;
    descartar: number;
  };
  recentAnalyses: number;
}

export interface StatisticsResponse {
  success: boolean;
  data: Statistics;
}
