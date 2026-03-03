/**
 * Job Positions Types
 * Types for dynamic job position management
 */

/**
 * Job Position entity from database
 */
export interface JobPosition {
  id: number;
  user_id: number;
  title: string;
  department: string | null;
  location: string | null;
  description: string;
  required_skills: string; // JSON string array
  desirable_skills: string | null; // JSON string array
  red_flags: string | null; // JSON string array
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_analyses?: number;
  total_candidates_analyzed?: number;
  last_analysis_date?: string;
}

/**
 * Parsed job position with arrays instead of JSON strings
 */
export interface JobPositionParsed extends Omit<JobPosition, 'required_skills' | 'desirable_skills' | 'red_flags'> {
  requiredSkills: string[];
  desirableSkills: string[];
  redFlags: string[];
}

/**
 * Create job position request payload
 */
export interface JobPositionCreateRequest {
  title: string;
  department?: string | null;
  location?: string | null;
  description: string;
  requiredSkills: string[];
  desirableSkills?: string[];
  redFlags?: string[];
}

/**
 * Update job position request payload
 */
export interface JobPositionUpdateRequest {
  title?: string;
  department?: string | null;
  location?: string | null;
  description?: string;
  requiredSkills?: string[];
  desirableSkills?: string[];
  redFlags?: string[];
  isActive?: boolean;
}

/**
 * Job position analytics data
 */
export interface JobPositionAnalytics {
  totalAnalyses: number;
  totalCandidatesAnalyzed: number;
  candidatesToInterview: number;
  candidatesMaybe: number;
  candidatesRejected: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  firstAnalysisDate: string | null;
  lastAnalysisDate: string | null;
  topCandidates: TopCandidate[];
}

/**
 * Top candidate from analytics
 */
export interface TopCandidate {
  name: string;
  email: string;
  score: number;
  category: 'entrevistar' | 'quizas' | 'descartar';
  analysis_date: string;
  analysis_id: number;
}

/**
 * Job position list response
 */
export interface JobPositionListResponse {
  success: boolean;
  positions: JobPosition[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Single job position response
 */
export interface JobPositionResponse {
  success: boolean;
  position: JobPosition;
}

/**
 * Job position analytics response
 */
export interface JobPositionAnalyticsResponse {
  success: boolean;
  position: JobPosition;
  analytics: JobPositionAnalytics;
}

/**
 * Job position analyses list response
 */
export interface JobPositionAnalysesResponse {
  success: boolean;
  position: JobPosition;
  analyses: Array<{
    id: number;
    analysis_date: string;
    excel_file_name: string;
    total_candidates: number;
    total_cvs_processed: number;
    summary: {
      totalAnalizados: number;
      paraEntrevistar: number;
      quizas: number;
      descartados: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Helper function to safely parse skill strings (handles both JSON arrays and comma-separated strings)
 */
function parseSkills(skillString: string | null | unknown): string[] {
  if (!skillString) return [];

  // Handle already-parsed arrays
  if (Array.isArray(skillString)) {
    return skillString.map(s => String(s));
  }

  // Handle non-string values (objects, numbers, etc.)
  if (typeof skillString !== 'string') {
    return [String(skillString)];
  }

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(skillString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If parsed but not an array, treat as single item
    return [String(parsed)];
  } catch {
    // If JSON parsing fails, treat as comma-separated string
    return skillString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}

/**
 * Helper function to parse job position JSON fields
 */
export function parseJobPosition(position: JobPosition): JobPositionParsed {
  return {
    ...position,
    requiredSkills: parseSkills(position.required_skills),
    desirableSkills: parseSkills(position.desirable_skills),
    redFlags: parseSkills(position.red_flags),
  };
}

/**
 * Helper function to format job position for API
 */
export function formatJobPositionForAPI(
  data: JobPositionCreateRequest | JobPositionUpdateRequest
): Record<string, unknown> {
  const formatted: Record<string, unknown> = {};

  if ('title' in data && data.title !== undefined) formatted.title = data.title;
  if ('department' in data) formatted.department = data.department;
  if ('location' in data) formatted.location = data.location;
  if ('description' in data && data.description !== undefined) formatted.description = data.description;
  if ('requiredSkills' in data && data.requiredSkills !== undefined) {
    formatted.requiredSkills = data.requiredSkills;
  }
  if ('desirableSkills' in data) formatted.desirableSkills = data.desirableSkills || [];
  if ('redFlags' in data) formatted.redFlags = data.redFlags || [];
  if ('isActive' in data) formatted.isActive = data.isActive;

  return formatted;
}
