/**
 * Analyses Response Transformer
 * Converts backend snake_case API responses to frontend camelCase structure
 */

import type {
  Statistics,
  CandidateDetail,
  AnalysisSummaryItem,
  AnalysisDetail,
} from '../types/analyses';

/**
 * Transform backend statistics response to frontend format
 */
export function transformStatistics(apiResponse: any): Statistics {
  const stats = apiResponse.statistics || apiResponse;

  return {
    totalAnalyses: parseInt(stats.total_analyses || '0'),
    totalCandidates: parseInt(stats.total_candidates_analyzed || '0'),
    candidatesToInterview: parseInt(stats.candidates_to_interview || '0'),
    averageScore: parseFloat(stats.average_score || '0'),
    categoryDistribution: {
      entrevistar: parseInt(stats.candidates_to_interview || '0'),
      quizas: parseInt(stats.candidates_maybe || '0'),
      descartar: parseInt(stats.candidates_rejected || '0'),
    },
    recentAnalyses: parseInt(stats.total_analyses || '0'),
  };
}

/**
 * Transform backend candidate response to frontend format
 */
export function transformCandidate(apiCandidate: any): CandidateDetail {
  return {
    id: String(apiCandidate.id || ''),
    analysisId: String(apiCandidate.analysis_id || apiCandidate.analysisId || ''),
    nombre: apiCandidate.name || apiCandidate.nombre || 'Desconocido',
    email: apiCandidate.email || 'No proporcionado',
    telefono: apiCandidate.phone || apiCandidate.telefono || 'No proporcionado',
    score: apiCandidate.score || 0,
    categoria: mapCategory(apiCandidate.category || apiCandidate.categoria),
    fortalezaPrincipal: apiCandidate.main_strength || apiCandidate.mainStrength || apiCandidate.fortalezaPrincipal || '',
    banderaRoja: apiCandidate.red_flag || apiCandidate.redFlag || apiCandidate.banderaRoja || 'Ninguna',
    fortalezas: apiCandidate.strengths || apiCandidate.fortalezas || [],
    areasAtencion: apiCandidate.areas_of_concern || apiCandidate.areasOfConcern || apiCandidate.areasAtencion || [],
    consistencia: apiCandidate.consistency || apiCandidate.consistencia,
    preguntaSugerida: apiCandidate.suggested_question || apiCandidate.suggestedQuestion || apiCandidate.preguntaSugerida,
  };
}

/**
 * Transform backend analysis summary to frontend format
 */
export function transformAnalysisSummary(apiAnalysis: any): AnalysisSummaryItem {
  const summary = apiAnalysis.summary || {};

  return {
    id: String(apiAnalysis.id || ''),
    excelFilename: apiAnalysis.excel_file_name || apiAnalysis.excelFilename || 'Sin nombre',
    analysisDate: apiAnalysis.analysis_date || apiAnalysis.analysisDate || new Date().toISOString(),
    totalCandidates: apiAnalysis.total_candidates || summary.totalAnalyzed || 0,
    paraEntrevistar: summary.toInterview || summary.paraEntrevistar || 0,
    quizas: summary.maybe || summary.quizas || 0,
    descartados: summary.rejected || summary.descartados || 0,
    cvsProcessed: apiAnalysis.total_cvs_processed || apiAnalysis.cvsProcessed || 0,
    errors: apiAnalysis.errors || 0,
    jobPositionId: apiAnalysis.job_position_id || apiAnalysis.jobPositionId || null,
    jobPositionTitle: apiAnalysis.job_position_title || apiAnalysis.jobPositionTitle,
  };
}

/**
 * Transform backend analysis detail response to frontend format
 */
export function transformAnalysisDetail(apiResponse: any): AnalysisDetail {
  const analysis = apiResponse.analysis || apiResponse;
  const summary = analysis.summary || {};
  const metadata = analysis.metadata || {};

  return {
    id: String(analysis.id || ''),
    excelFilename: analysis.excel_file_name || analysis.excelFilename || 'Sin nombre',
    analysisDate: analysis.analysis_date || analysis.analysisDate || new Date().toISOString(),
    jobPositionId: analysis.job_position_id || analysis.jobPositionId || null,
    jobPositionTitle: analysis.job_snapshot?.title || analysis.jobPositionTitle,
    summary: {
      totalAnalizados: summary.totalAnalyzed || summary.totalAnalizados || 0,
      paraEntrevistar: summary.toInterview || summary.paraEntrevistar || 0,
      quizas: summary.maybe || summary.quizas || 0,
      descartados: summary.rejected || summary.descartados || 0,
      top3: (summary.top3 || []).map((top: any) => ({
        nombre: top.name || top.nombre || '',
        email: top.email || '',
        telefono: top.phone || top.telefono || '',
        score: top.score || 0,
        categoria: mapCategory(top.category || top.categoria || 'descartar'),
        fortalezaPrincipal: top.reason || top.mainStrength || top.fortalezaPrincipal || '',
        banderaRoja: top.redFlag || top.banderaRoja || 'Ninguna',
      })),
    },
    candidates: (analysis.candidates || []).map(transformCandidate),
    metadata: {
      totalCandidates: metadata.totalCandidates || analysis.total_candidates || 0,
      cvsProcessed: metadata.totalCVsProcessed || analysis.total_cvs_processed || 0,
      errors: metadata.totalCVsWithErrors || metadata.errors || 0,
      promptSize: metadata.promptSize || 0,
      fileHash: analysis.excel_file_hash || metadata.fileHash || '',
    },
  };
}

/**
 * Map English category names to Spanish
 */
function mapCategory(category: string): 'entrevistar' | 'quizas' | 'descartar' {
  const categoryMap: Record<string, 'entrevistar' | 'quizas' | 'descartar'> = {
    'interview': 'entrevistar',
    'entrevistar': 'entrevistar',
    'maybe': 'quizas',
    'quizas': 'quizas',
    'reject': 'descartar',
    'descartar': 'descartar',
  };

  return categoryMap[category?.toLowerCase()] || 'descartar';
}
