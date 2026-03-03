/**
 * Analysis Response Transformer
 * Converts v4.0.0 English API response to Spanish frontend structure
 */

import type { AnalysisResult, CandidateScore } from '../types/cv-analysis';

/**
 * Transform v4.0.0 API response to frontend format
 */
export function transformAnalysisResponse(apiResponse: any): AnalysisResult {
  // Handle array of candidates (v4.0.0 format)
  const candidates = Array.isArray(apiResponse) ? apiResponse : apiResponse.analysis || [];
  const summary = apiResponse.summary || {};

  // Transform candidates from English to Spanish field names
  const candidatos: CandidateScore[] = candidates.map((candidate: any) => ({
    nombre: candidate.name || candidate.nombre || 'Desconocido',
    email: candidate.email || 'No proporcionado',
    telefono: candidate.phone || candidate.telefono || 'No proporcionado',
    score: candidate.score || 0,
    categoria: mapCategory(candidate.category || candidate.categoria),
    fortalezaPrincipal: candidate.mainStrength || candidate.fortalezaPrincipal || '',
    banderaRoja: candidate.redFlag || candidate.banderaRoja || 'Ninguna',
    fortalezas: candidate.strengths || candidate.fortalezas || [],
    areasAtencion: candidate.areasOfConcern || candidate.areasAtencion || [],
    consistencia: candidate.consistency || candidate.consistencia,
    preguntaSugerida: candidate.suggestedQuestion || candidate.preguntaSugerida,
  }));

  // Transform summary from English to Spanish
  const resumen = {
    totalAnalizados: summary.totalAnalyzed || candidatos.length,
    paraEntrevistar: summary.toInterview || candidatos.filter(c => c.categoria === 'entrevistar').length,
    quizas: summary.maybe || candidatos.filter(c => c.categoria === 'quizas').length,
    descartados: summary.rejected || candidatos.filter(c => c.categoria === 'descartar').length,
    top3: (summary.top3 || []).map((top: any) => ({
      nombre: top.name || top.nombre || '',
      score: top.score || 0,
      fortalezaPrincipal: top.reason || top.fortalezaPrincipal || '',
    })),
  };

  return {
    resumen,
    candidatos,
    rawResponse: apiResponse,
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
