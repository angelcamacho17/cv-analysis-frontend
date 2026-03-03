/**
 * Analysis Detail Page Component
 * Shows detailed view of a specific analysis with all its candidates
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnalysisDetail } from '../../services/analyses.service';
import type { AnalysisDetail, CandidateDetail, CandidateCategory } from '../../types/analyses';

export const AnalysisDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('score-desc');

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    } else {
      setError('ID de análisis no válido');
    }
  }, [id]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, filterText, filterCategory, sortBy]);

  const loadAnalysis = async (analysisId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAnalysisDetail(analysisId);
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError('No se pudo cargar el análisis');
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Error al cargar el análisis: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!analysis) {
      setFilteredCandidates([]);
      return;
    }

    let candidates = [...analysis.candidates];

    // Filter by text
    if (filterText.trim()) {
      const text = filterText.toLowerCase();
      candidates = candidates.filter(
        (c) => c.nombre.toLowerCase().includes(text) || c.email.toLowerCase().includes(text)
      );
    }

    // Filter by category
    if (filterCategory) {
      candidates = candidates.filter((c) => c.categoria === filterCategory);
    }

    // Sort
    candidates.sort((a, b) => {
      if (sortBy === 'score-desc') return b.score - a.score;
      if (sortBy === 'score-asc') return a.score - b.score;
      if (sortBy === 'name') {
        const nameA = a.nombre.toLowerCase();
        const nameB = b.nombre.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    setFilteredCandidates(candidates);
  };

  const resetFilters = () => {
    setFilterText('');
    setFilterCategory('');
    setSortBy('score-desc');
  };

  const goBack = () => {
    navigate('/candidates');
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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Back button */}
      <button
        onClick={goBack}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
      >
        <span>←</span> Volver
      </button>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 mt-4">Cargando análisis...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {analysis && (
        <div>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.excelFilename}</h1>
            <p className="text-gray-600 mb-4">📅 {new Date(analysis.analysisDate).toLocaleString()}</p>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{analysis.summary.totalAnalizados}</div>
                <div className="text-sm text-gray-600">Total Candidatos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{analysis.summary.paraEntrevistar}</div>
                <div className="text-sm text-gray-600">Para Entrevistar</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{analysis.summary.quizas}</div>
                <div className="text-sm text-gray-600">Quizás</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{analysis.summary.descartados}</div>
                <div className="text-sm text-gray-600">Descartados</div>
              </div>
            </div>

            {/* Top 3 */}
            {analysis.summary.top3.length > 0 && (
              <div className="border-t pt-4">
                <h2 className="text-xl font-bold mb-3">🏆 Top 3 Candidatos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.summary.top3.map((top, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <h3 className="font-semibold text-gray-900">{top.nombre}</h3>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 mb-1">{top.score}</div>
                      <p className="text-sm text-gray-700">{top.fortalezaPrincipal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Nombre o email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="entrevistar">✅ Para Entrevistar</option>
                  <option value="quizas">🤔 Quizás</option>
                  <option value="descartar">❌ Descartar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="score-desc">Score (Mayor a menor)</option>
                  <option value="score-asc">Score (Menor a mayor)</option>
                  <option value="name">Nombre (A-Z)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  🔄 Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">
                Candidatos ({filteredCandidates.length} de {analysis.candidates.length})
              </h2>
            </div>

            <div className="divide-y">
              {filteredCandidates.map((candidate, idx) => (
                <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Candidate Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.nombre}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${getCategoryBgColor(candidate.categoria)}`}>
                          {getCategoryIcon(candidate.categoria)} {getCategoryLabel(candidate.categoria)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">📧 {candidate.email}</p>
                        {candidate.telefono && <p className="text-sm text-gray-600">📞 {candidate.telefono}</p>}
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
                          <p className="font-semibold text-gray-700 text-sm mb-1">⚠️ Áreas de Atención:</p>
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

                    {/* Score Badge */}
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

            {filteredCandidates.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No se encontraron candidatos con los filtros aplicados
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="mt-6 bg-white rounded-lg shadow p-4 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">📊 Metadata del Análisis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <p>
                CVs Procesados: <span className="font-semibold">{analysis.metadata.cvsProcessed}</span>
              </p>
              {analysis.metadata.errors !== undefined && (
                <p>
                  Errores de CV: <span className="font-semibold">{analysis.metadata.errors}</span>
                </p>
              )}
              {analysis.metadata.promptSize && (
                <p>
                  Tamaño del Prompt:{' '}
                  <span className="font-semibold">{analysis.metadata.promptSize} chars</span>
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Hash: {analysis.metadata.fileHash}</p>
          </div>
        </div>
      )}
    </div>
  );
};
