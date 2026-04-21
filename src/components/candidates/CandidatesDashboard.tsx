/**
 * Candidates Dashboard Component
 * Clean view with 3 filters: position, category, score range
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchCandidates } from '../../services/analyses.service';
import { getJobPositions } from '../../services/job-positions.service';
import type { CandidateDetail, CandidateCategory } from '../../types/analyses';
import { DownloadCVButton } from '../shared/DownloadCVButton';
import type { JobPosition } from '../../types/job-positions';

// Score bar
const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
};

// Avatar with initials
const Avatar = ({ name, rank }: { name: string; rank?: number }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">
      {rank !== undefined ? rank : initials}
    </div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />
);

const CardSkeleton = () => (
  <div className="p-4 rounded-xl border border-gray-100 flex items-center gap-4">
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-12" />
  </div>
);

export const CandidatesDashboard = () => {
  const [allCandidates, setAllCandidates] = useState<CandidateDetail[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPosition, setFilterPosition] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');

  // Pagination
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(allCandidates.length / pageSize);
  const candidates = allCandidates.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    loadPositions();
  }, []);

  // Re-fetch from server when filters change
  useEffect(() => {
    fetchCandidates();
    setPage(1);
  }, [filterPosition, filterCategory, filterMinScore, filterMaxScore]);

  const loadPositions = async () => {
    try {
      setPositions(await getJobPositions({}));
    } catch (err) {
      console.error('Error loading positions:', err);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await searchCandidates({
        jobPositionId: filterPosition ? Number(filterPosition) : undefined,
        category: filterCategory ? (filterCategory as CandidateCategory) : undefined,
        minScore: filterMinScore ? Number(filterMinScore) : undefined,
        maxScore: filterMaxScore ? Number(filterMaxScore) : undefined,
      });
      if (response.success) {
        setAllCandidates(response.data);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterPosition('');
    setFilterCategory('');
    setFilterMinScore('');
    setFilterMaxScore('');
    setPage(1);
  };

  const viewCandidateDetail = (candidate: CandidateDetail) => {
    setSelectedCandidate(candidate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 65) return 'text-amber-600';
    return 'text-red-500';
  };

  const getCategoryLabel = (category: CandidateCategory): string => {
    return { entrevistar: 'Entrevistar', quizas: 'Quizas', descartar: 'Descartar' }[category] || category;
  };

  const getCategoryBgColor = (category: CandidateCategory): string => {
    return { entrevistar: 'bg-green-100 text-green-800', quizas: 'bg-yellow-100 text-yellow-800', descartar: 'bg-red-100 text-red-800' }[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: CandidateCategory): string => {
    return { entrevistar: '✅', quizas: '🤔', descartar: '❌' }[category] || '❓';
  };

  const hasActiveFilters = filterPosition || filterCategory || filterMinScore || filterMaxScore;

  // Candidate Detail View
  if (selectedCandidate) {
    return (
      <div>
        <button
          onClick={() => setSelectedCandidate(null)}
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
                <h1 className="text-3xl font-bold text-gray-900">{selectedCandidate.nombre}</h1>
                <DownloadCVButton size="md" />
                <span className={`px-3 py-1 text-sm rounded-lg ${getCategoryBgColor(selectedCandidate.categoria)}`}>
                  {getCategoryIcon(selectedCandidate.categoria)} {getCategoryLabel(selectedCandidate.categoria)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-gray-600">
                  {selectedCandidate.email}
                </p>
                {selectedCandidate.telefono && <p className="text-gray-600">{selectedCandidate.telefono}</p>}
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
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">Fortaleza Principal</p>
              <p className="text-gray-700">{selectedCandidate.fortalezaPrincipal}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">Bandera Roja</p>
              <p className="text-gray-700">{selectedCandidate.banderaRoja}</p>
            </div>
          </div>

          {selectedCandidate.fortalezas && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-3">Fortalezas</p>
              <ul className="space-y-2">
                {selectedCandidate.fortalezas.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">-</span>
                    <span className="text-gray-700">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedCandidate.areasAtencion && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-3">Areas de Atencion</p>
              <ul className="space-y-2">
                {selectedCandidate.areasAtencion.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">-</span>
                    <span className="text-gray-700">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedCandidate.consistencia && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">Consistencia</p>
              <p className="text-gray-700">{selectedCandidate.consistencia}</p>
            </div>
          )}

          {selectedCandidate.preguntaSugerida && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
              <p className="font-semibold text-gray-800 mb-2">Pregunta Sugerida para la Entrevista</p>
              <p className="text-gray-700 italic">"{selectedCandidate.preguntaSugerida}"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Explora y filtra todos los candidatos analizados</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Analisis
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Position filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Posicion</label>
            <select
              value={filterPosition}
              onChange={(e) => { setFilterPosition(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
            >
              <option value="">Todas las posiciones</option>
              {positions.map((pos) => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
            >
              <option value="">Todas</option>
              <option value="entrevistar">Entrevistar</option>
              <option value="quizas">Quizas</option>
              <option value="descartar">Descartar</option>
            </select>
          </div>

          {/* Score range */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rango de Score</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filterMinScore}
                onChange={(e) => { setFilterMinScore(e.target.value); setPage(1); }}
                min="0"
                max="100"
                placeholder="Min"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
              />
              <span className="text-gray-300 flex-shrink-0">&mdash;</span>
              <input
                type="number"
                value={filterMaxScore}
                onChange={(e) => { setFilterMaxScore(e.target.value); setPage(1); }}
                min="0"
                max="100"
                placeholder="Max"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <div className="flex-shrink-0 flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Results header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : (
              <>Mostrando {candidates.length} de {allCandidates.length} candidato{allCandidates.length !== 1 ? 's' : ''}</>
            )}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-gray-400">Pagina {page} de {totalPages}</p>
          )}
        </div>

        <div className="p-4">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {!loading && candidates.length > 0 && (
            <div className="space-y-2">
              {candidates.map((candidate, i) => {
                const globalIndex = (page - 1) * pageSize + i;
                const isTop1 = globalIndex === 0 && !hasActiveFilters;
                return (
                  <div
                    key={candidate.id || i}
                    onClick={() => viewCandidateDetail(candidate)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      isTop1
                        ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-md'
                        : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <Avatar name={candidate.nombre} rank={!hasActiveFilters ? globalIndex + 1 : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-gray-900 truncate ${isTop1 ? 'text-base' : 'text-sm'}`}>{candidate.nombre}</h3>
                        <DownloadCVButton />
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${getCategoryBgColor(candidate.categoria)}`}>
                          {getCategoryLabel(candidate.categoria)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{candidate.fortalezaPrincipal}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${getScoreColor(candidate.score)} ${isTop1 ? 'text-3xl' : ''}`}>
                        {candidate.score}
                      </div>
                      <ScoreBar score={candidate.score} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && candidates.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-400 mb-4">
                {hasActiveFilters ? 'No se encontraron candidatos con estos filtros' : 'Aun no hay candidatos analizados'}
              </p>
              {!hasActiveFilters && (
                <Link to="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Realizar primer analisis
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18M18 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 py-2 text-sm text-gray-400">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === item
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
