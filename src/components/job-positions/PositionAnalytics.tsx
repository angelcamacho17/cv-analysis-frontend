/**
 * Position Analytics Component
 * Displays detailed analytics for a specific job position
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPositionAnalytics, getPositionAnalyses } from '../../services/job-positions.service';
import { parseJobPosition } from '../../types/job-positions';
import type { JobPositionAnalyticsResponse, JobPositionAnalysesResponse } from '../../types/job-positions';

export const PositionAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<JobPositionAnalyticsResponse | null>(null);
  const [analyses, setAnalyses] = useState<JobPositionAnalysesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (positionId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, analysesData] = await Promise.all([
        getPositionAnalytics(positionId),
        getPositionAnalyses(positionId, { page: 1, limit: 10 }),
      ]);

      setAnalytics(analyticsData);
      setAnalyses(analysesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-gray-600">Cargando analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">❌ {error || 'Error al cargar datos'}</p>
        <button
          onClick={() => navigate('/positions')}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Volver a Posiciones
        </button>
      </div>
    );
  }

  const { position, analytics: stats } = analytics;
  const parsed = parseJobPosition(position);

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Analisis</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalAnalyses}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Candidatos</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCandidatesAnalyzed}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Entrevistar</div>
          <div className="text-3xl font-bold text-green-600">{stats.candidatesToInterview}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Score Promedio</div>
          <div className="text-3xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Distribucion de Categorias</h3>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Para Entrevistar</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.candidatesToInterview} ({getPercentage(stats.candidatesToInterview, stats.totalCandidatesAnalyzed)}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${getPercentage(stats.candidatesToInterview, stats.totalCandidatesAnalyzed)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Quizas</span>
              <span className="text-sm font-semibold text-amber-500">
                {stats.candidatesMaybe} ({getPercentage(stats.candidatesMaybe, stats.totalCandidatesAnalyzed)}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${getPercentage(stats.candidatesMaybe, stats.totalCandidatesAnalyzed)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Descartados</span>
              <span className="text-sm font-semibold text-red-500">
                {stats.candidatesRejected} ({getPercentage(stats.candidatesRejected, stats.totalCandidatesAnalyzed)}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-300"
                style={{ width: `${getPercentage(stats.candidatesRejected, stats.totalCandidatesAnalyzed)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Candidates */}
      {stats.topCandidates && stats.topCandidates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Candidatos</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCandidates.map((candidate, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white font-bold rounded-full">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{candidate.name}</td>
                    <td className="py-3 px-4 text-gray-600">{candidate.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-lg">
                        {candidate.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(candidate.analysis_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      {analyses && analyses.analyses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Analisis Recientes</h3>

          <div className="space-y-3">
            {analyses.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/candidates/analysis/${analysis.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{analysis.excel_file_name}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.analysis_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
                      {analysis.total_candidates} candidatos
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">{analysis.summary.paraEntrevistar}</div>
                    <div className="text-gray-500">Entrevistar</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-600">{analysis.summary.quizas}</div>
                    <div className="text-gray-500">Quizás</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-600">{analysis.summary.descartados}</div>
                    <div className="text-gray-500">Descartados</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
