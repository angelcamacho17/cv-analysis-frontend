/**
 * Position Analytics Component
 * Displays analytics, analyses, and all candidates for a job position
 * Stat cards and analysis cards act as filters for the candidate list
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPositionAnalytics, getPositionAnalyses } from '../../services/job-positions.service';
import { searchCandidates } from '../../services/analyses.service';
import { parseJobPosition } from '../../types/job-positions';
import type { JobPositionAnalyticsResponse, JobPositionAnalysesResponse } from '../../types/job-positions';
import type { CandidateDetail, CandidateCategory } from '../../types/analyses';

type CategoryFilter = 'all' | CandidateCategory;

export const PositionAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<JobPositionAnalyticsResponse | null>(null);
  const [analyses, setAnalyses] = useState<JobPositionAnalysesResponse | null>(null);
  const [candidates, setCandidates] = useState<CandidateDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [analysisFilter, setAnalysisFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [showAnalysesState, setShowAnalysesState] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
      loadCandidates(parseInt(id));
    }
  }, [id]);

  const loadData = async (positionId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, analysesData] = await Promise.all([
        getPositionAnalytics(positionId),
        getPositionAnalyses(positionId, { page: 1, limit: 50 }),
      ]);

      setAnalytics(analyticsData);
      setAnalyses(analysesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async (positionId: number) => {
    try {
      setLoadingCandidates(true);
      const response = await searchCandidates({ jobPositionId: positionId, limit: 500 });
      if (response.success) {
        setCandidates(response.data);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Apply filters
  const filteredCandidates = candidates.filter((c) => {
    if (categoryFilter !== 'all' && c.categoria !== categoryFilter) return false;
    if (analysisFilter && c.analysisId !== analysisFilter) return false;
    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      if (!c.nombre.toLowerCase().includes(text) && !c.email.toLowerCase().includes(text)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const paginatedCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, analysisFilter, searchText]);

  const handleCategoryClick = (category: CategoryFilter) => {
    setCategoryFilter(categoryFilter === category ? 'all' : category);
  };

  const handleAnalysisClick = (analysisId: string) => {
    setAnalysisFilter(analysisFilter === analysisId ? '' : analysisId);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryBgColor = (category: CandidateCategory): string => {
    const colors: Record<CandidateCategory, string> = {
      entrevistar: 'bg-green-100 text-green-800',
      quizas: 'bg-yellow-100 text-yellow-800',
      descartar: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: CandidateCategory): string => {
    const labels: Record<CandidateCategory, string> = {
      entrevistar: 'Entrevistar',
      quizas: 'Quizas',
      descartar: 'Descartar',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 rounded-xl h-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error || 'Error al cargar datos'}</p>
        <button
          onClick={() => navigate('/positions')}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Volver a Posiciones
        </button>
      </div>
    );
  }

  const { position, analytics: stats } = analytics;
  const parsed = parseJobPosition(position);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/positions')}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Posiciones
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{position.title}</h1>
          {position.department && <p className="text-sm text-gray-500 mb-1">{position.department}</p>}
          {position.location && <p className="text-sm text-gray-400 mb-4">{position.location}</p>}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Habilidades Requeridas:</p>
            <div className="flex flex-wrap gap-2">
              {parsed.requiredSkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Clickable as filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setCategoryFilter('all')}
          className={`bg-white rounded-xl border-2 p-5 text-center cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === 'all' ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Candidatos</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCandidatesAnalyzed}</div>
          {categoryFilter === 'all' && <div className="text-xs text-blue-500 mt-1">Filtro activo</div>}
        </div>

        <div
          onClick={() => handleCategoryClick('entrevistar')}
          className={`bg-white rounded-xl border-2 p-5 text-center cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === 'entrevistar' ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Entrevistar</div>
          <div className="text-3xl font-bold text-green-600">{stats.candidatesToInterview}</div>
          {categoryFilter === 'entrevistar' && <div className="text-xs text-green-500 mt-1">Filtro activo</div>}
        </div>

        <div
          onClick={() => handleCategoryClick('quizas')}
          className={`bg-white rounded-xl border-2 p-5 text-center cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === 'quizas' ? 'border-amber-500 ring-1 ring-amber-200' : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quizas</div>
          <div className="text-3xl font-bold text-amber-500">{stats.candidatesMaybe}</div>
          {categoryFilter === 'quizas' && <div className="text-xs text-amber-500 mt-1">Filtro activo</div>}
        </div>

        <div
          onClick={() => handleCategoryClick('descartar')}
          className={`bg-white rounded-xl border-2 p-5 text-center cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === 'descartar' ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Descartados</div>
          <div className="text-3xl font-bold text-red-500">{stats.candidatesRejected}</div>
          {categoryFilter === 'descartar' && <div className="text-xs text-red-500 mt-1">Filtro activo</div>}
        </div>
      </div>

      {/* Analyses - Collapsible, clickable as filter */}
      {analyses && analyses.analyses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowAnalysesState(!showAnalysesState)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Analisis Realizados</h3>
              <span className="text-xs text-gray-400">({analyses.analyses.length})</span>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAnalysesState ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAnalysesState && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 mb-3">Clic en un analisis para filtrar candidatos</p>
              <div className="flex flex-wrap gap-2">
                {analyses.analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => handleAnalysisClick(String(analysis.id))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      analysisFilter === String(analysis.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {analysis.excel_file_name} ({analysis.total_candidates})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filters indicator */}
      {(categoryFilter !== 'all' || analysisFilter || searchText) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Filtros:</span>
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryBgColor(categoryFilter)} flex items-center gap-1`}
            >
              {getCategoryLabel(categoryFilter)}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {analysisFilter && (
            <button
              onClick={() => setAnalysisFilter('')}
              className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"
            >
              Analisis #{analysisFilter}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1"
            >
              "{searchText}"
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => { setCategoryFilter('all'); setAnalysisFilter(''); setSearchText(''); }}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900">
            Candidatos <span className="text-sm font-normal text-gray-400">({filteredCandidates.length})</span>
          </h3>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-64"
          />
        </div>

        {loadingCandidates ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-gray-200 rounded h-12 w-12 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-200 rounded h-4 w-1/3" />
                  <div className="bg-gray-200 rounded h-3 w-1/2" />
                </div>
                <div className="bg-gray-200 rounded h-8 w-12" />
              </div>
            ))}
          </div>
        ) : paginatedCandidates.length > 0 ? (
          <div className="divide-y">
            {paginatedCandidates.map((candidate, idx) => (
              <div key={candidate.id || idx} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{candidate.nombre}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getCategoryBgColor(candidate.categoria)}`}>
                        {getCategoryLabel(candidate.categoria)}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                      {candidate.telefono && <p className="text-sm text-gray-600">{candidate.telefono}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700">💪 Fortaleza Principal:</p>
                        <p className="text-gray-600">{candidate.fortalezaPrincipal}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">🚩 Bandera Roja:</p>
                        <p className="text-gray-600">{candidate.banderaRoja}</p>
                      </div>
                    </div>

                    {candidate.fortalezas && (
                      <div className="mt-3">
                        <p className="font-semibold text-gray-700 text-sm mb-1">✨ Fortalezas:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {candidate.fortalezas.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {candidate.areasAtencion && (
                      <div className="mt-3">
                        <p className="font-semibold text-gray-700 text-sm mb-1">⚠️ Areas de Atencion:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {candidate.areasAtencion.map((area, i) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {candidate.preguntaSugerida && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="font-semibold text-gray-700 text-sm mb-1">💬 Pregunta Sugerida:</p>
                        <p className="text-sm text-gray-700 italic">{candidate.preguntaSugerida}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 text-center">
                    <div className={`text-4xl font-bold mb-1 ${getScoreColor(candidate.score)}`}>
                      {candidate.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            {candidates.length === 0
              ? 'No hay candidatos analizados para esta posicion'
              : 'No se encontraron candidatos con los filtros aplicados'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Pagina {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
