/**
 * Candidates Dashboard Component
 * Shows statistics, top candidates, search, and analyses history
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getStatistics,
  getTopCandidates,
  searchCandidates,
  getAnalyses,
} from '../../services/analyses.service';
import type {
  Statistics,
  CandidateDetail,
  CandidateSearchParams,
  AnalysisSummaryItem,
  CandidateCategory,
} from '../../types/analyses';

type Tab = 'top' | 'search' | 'analyses';

export const CandidatesDashboard = () => {
  // State
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [topCandidates, setTopCandidates] = useState<CandidateDetail[]>([]);
  const [searchResults, setSearchResults] = useState<CandidateDetail[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisSummaryItem[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);

  // Loading states
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Search params
  const [searchParams, setSearchParams] = useState<CandidateSearchParams>({});

  // Tabs
  const tabs = [
    { id: 'top' as Tab, label: 'Top Candidatos', icon: '🏆' },
    { id: 'search' as Tab, label: 'Buscar', icon: '🔍' },
    { id: 'analyses' as Tab, label: 'Análisis', icon: '📋' },
  ];
  const [activeTab, setActiveTab] = useState<Tab>('top');

  useEffect(() => {
    loadStatistics();
    loadTopCandidates();
    loadAnalyses(1);
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const loadTopCandidates = async () => {
    setLoadingTop(true);
    try {
      const candidates = await getTopCandidates(10);
      setTopCandidates(candidates);
    } catch (err) {
      console.error('Error loading top candidates:', err);
    } finally {
      setLoadingTop(false);
    }
  };

  const performSearch = async () => {
    setLoadingSearch(true);
    try {
      const response = await searchCandidates(searchParams);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (err) {
      console.error('Error searching candidates:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const resetSearch = () => {
    setSearchParams({});
    setSearchResults([]);
  };

  const loadAnalyses = async (page: number = 1) => {
    setLoadingAnalyses(true);
    try {
      const response = await getAnalyses(page, 10);
      if (response.success) {
        setAnalyses(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Error loading analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const viewCandidateDetail = (candidate: CandidateDetail) => {
    setSelectedCandidate(candidate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToList = () => {
    setSelectedCandidate(null);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: CandidateCategory): string => {
    const icons: Record<CandidateCategory, string> = {
      entrevistar: '✅',
      quizas: '🤔',
      descartar: '❌',
    };
    return icons[category] || '❓';
  };

  const getCategoryLabel = (category: CandidateCategory): string => {
    const labels: Record<CandidateCategory, string> = {
      entrevistar: 'Entrevistar',
      quizas: 'Quizás',
      descartar: 'Descartar',
    };
    return labels[category] || category;
  };

  const getCategoryBgColor = (category: CandidateCategory): string => {
    const colors: Record<CandidateCategory, string> = {
      entrevistar: 'bg-green-100 text-green-800',
      quizas: 'bg-yellow-100 text-yellow-800',
      descartar: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getAverageScore = (): string => {
    if (!statistics || statistics.averageScore == null) {
      return '0.0';
    }
    const score = Number(statistics.averageScore);
    return isNaN(score) ? '0.0' : score.toFixed(1);
  };

  // Candidate Detail View
  if (selectedCandidate) {
    return (
      <div>
        <button
          onClick={backToList}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 blur-[2px]">{selectedCandidate.nombre}</h1>
                <span className={`px-3 py-1 text-sm rounded-lg ${getCategoryBgColor(selectedCandidate.categoria)}`}>
                  {getCategoryIcon(selectedCandidate.categoria)} {getCategoryLabel(selectedCandidate.categoria)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-gray-600">
                  📧 <span className="blur-[2px]">{selectedCandidate.email}</span>
                </p>
                {selectedCandidate.telefono && <p className="text-gray-600">📞 {selectedCandidate.telefono}</p>}
              </div>
            </div>
            <div className="text-center ml-6">
              <div className={`text-5xl font-bold mb-1 ${getScoreColor(selectedCandidate.score)}`}>
                {selectedCandidate.score}
              </div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fortaleza Principal */}
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">💪</span> Fortaleza Principal
              </p>
              <p className="text-gray-700">{selectedCandidate.fortalezaPrincipal}</p>
            </div>

            {/* Bandera Roja */}
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🚩</span> Bandera Roja
              </p>
              <p className="text-gray-700">{selectedCandidate.banderaRoja}</p>
            </div>
          </div>

          {/* Fortalezas */}
          {selectedCandidate.fortalezas && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">✨</span> Fortalezas
              </p>
              <ul className="space-y-2">
                {selectedCandidate.fortalezas.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Áreas de Atención */}
          {selectedCandidate.areasAtencion && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Áreas de Atención
              </p>
              <ul className="space-y-2">
                {selectedCandidate.areasAtencion.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consistencia */}
          {selectedCandidate.consistencia && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🔍</span> Consistencia
              </p>
              <p className="text-gray-700">{selectedCandidate.consistencia}</p>
            </div>
          )}

          {/* Pregunta Sugerida */}
          {selectedCandidate.preguntaSugerida && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">💬</span> Pregunta Sugerida para la Entrevista
              </p>
              <p className="text-gray-700 italic">{selectedCandidate.preguntaSugerida}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Gestion de Candidatos</h1>
        <p className="text-sm text-gray-500">Busca, filtra y revisa el historial de candidatos analizados</p>
      </div>

      {/* Estadisticas Generales */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Total Analisis</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalAnalyses}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Candidatos</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalCandidates}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Para Entrevistar</p>
            <p className="text-3xl font-bold text-green-600">{statistics.candidatesToInterview}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Score Promedio</p>
            <p className="text-3xl font-bold text-blue-600">{getAverageScore()}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-2">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Top Candidatos Tab */}
          {activeTab === 'top' && (
            <div>
              <h2 className="text-xl font-bold mb-4">🏆 Top 10 Candidatos</h2>

              {loadingTop && (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 mt-2">Cargando top candidatos...</p>
                </div>
              )}

              {!loadingTop && topCandidates.length > 0 && (
                <div className="space-y-3">
                  {topCandidates.map((candidate, i) => (
                    <div
                      key={candidate.id || i}
                      onClick={() => viewCandidateDetail(candidate)}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-300"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 blur-[2px]">{candidate.nombre}</h3>
                        <p className="text-sm text-gray-600 blur-[2px]">{candidate.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{candidate.fortalezaPrincipal}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}>
                          {candidate.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCategoryIcon(candidate.categoria)} {getCategoryLabel(candidate.categoria)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buscar Candidatos Tab */}
          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-bold mb-4">🔍 Buscar Candidatos</h2>

              {/* Filtros de búsqueda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={searchParams.name || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                    placeholder="Buscar por nombre..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={searchParams.email || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                    placeholder="Buscar por email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={searchParams.category || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        category: e.target.value as CandidateCategory | 'all',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    <option value="entrevistar">✅ Para Entrevistar</option>
                    <option value="quizas">🤔 Quizás</option>
                    <option value="descartar">❌ Descartar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Mínimo</label>
                  <input
                    type="number"
                    value={searchParams.minScore || ''}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, minScore: Number(e.target.value) || undefined })
                    }
                    min="0"
                    max="100"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Máximo</label>
                  <input
                    type="number"
                    value={searchParams.maxScore || ''}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, maxScore: Number(e.target.value) || undefined })
                    }
                    min="0"
                    max="100"
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={performSearch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔍 Buscar
                  </button>
                  <button
                    onClick={resetSearch}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    🔄 Limpiar
                  </button>
                </div>
              </div>

              {/* Resultados */}
              {loadingSearch && (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 mt-2">Buscando candidatos...</p>
                </div>
              )}

              {!loadingSearch && searchResults.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Se encontraron {searchResults.length} candidato(s)</p>

                  <div className="space-y-3">
                    {searchResults.map((candidate, idx) => (
                      <div
                        key={candidate.id || idx}
                        onClick={() => viewCandidateDetail(candidate)}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 blur-[2px]">{candidate.nombre}</h3>
                            <p className="text-sm text-gray-600 blur-[2px]">{candidate.email}</p>
                            <p className="text-sm text-gray-500 mt-1">📞 {candidate.telefono}</p>
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>Fortaleza:</strong> {candidate.fortalezaPrincipal}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-3xl font-bold mb-1 ${getScoreColor(candidate.score)}`}>
                              {candidate.score}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${getCategoryBgColor(candidate.categoria)}`}>
                              {getCategoryIcon(candidate.categoria)} {getCategoryLabel(candidate.categoria)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingSearch && searchResults.length === 0 && Object.keys(searchParams).length > 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron candidatos con los filtros seleccionados</p>
                </div>
              )}
            </div>
          )}

          {/* Lista de Análisis Tab */}
          {activeTab === 'analyses' && (
            <div>
              <h2 className="text-xl font-bold mb-4">📋 Historial de Análisis</h2>

              {loadingAnalyses && (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 mt-2">Cargando análisis...</p>
                </div>
              )}

              {!loadingAnalyses && analyses && analyses.length > 0 && (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <Link
                      key={analysis.id}
                      to={`/candidates/analysis/${analysis.id}`}
                      className="block p-5 bg-gray-50 rounded-xl hover:bg-blue-50/50 hover:ring-1 hover:ring-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{analysis.excelFilename}</h3>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {new Date(analysis.analysisDate).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                          {analysis.totalCandidates} candidatos
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-xl font-bold text-green-600">{analysis.paraEntrevistar}</div>
                          <div className="text-xs text-gray-400">Entrevistar</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-xl font-bold text-amber-500">{analysis.quizas}</div>
                          <div className="text-xs text-gray-400">Quizas</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-xl font-bold text-red-500">{analysis.descartados}</div>
                          <div className="text-xs text-gray-400">Descartados</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!loadingAnalyses && (!analyses || analyses.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay análisis disponibles aún</p>
                  <Link
                    to="/"
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Realizar primer análisis
                  </Link>
                </div>
              )}

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => loadAnalyses(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => loadAnalyses(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
