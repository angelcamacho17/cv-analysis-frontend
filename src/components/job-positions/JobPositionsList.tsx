/**
 * Job Positions List Component
 * Displays grid of all job positions with actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobPositions, deleteJobPosition } from '../../services/job-positions.service';
import { parseJobPosition } from '../../types/job-positions';
import { useAuth } from '../../context/AuthContext';
import type { JobPosition } from '../../types/job-positions';

interface JobPositionsListProps {
  onCreateNew: () => void;
  onEdit: (position: JobPosition) => void;
  onAnalyze: (position: JobPosition) => void;
  refreshTrigger?: number;
}

export const JobPositionsList = ({
  onCreateNew,
  onEdit,
  onAnalyze,
  refreshTrigger = 0,
}: JobPositionsListProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
  }, [refreshTrigger]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJobPositions({ active: true });
      setPositions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar posiciones';

      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('No autorizado')) {
        setError('Sesión expirada o token inválido. Por favor inicia sesión nuevamente.');
      } else {
        setError(errorMessage);
      }

      console.error('Error loading positions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (position: JobPosition) => {
    const confirmMessage = `¿Eliminar "${position.title}"?\n\nLos análisis pasados se conservarán.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteJobPosition(position.id);
      setPositions(positions.filter((p) => p.id !== position.id));
    } catch (err) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleViewAnalytics = (positionId: number) => {
    navigate(`/positions/${positionId}/analytics`);
  };

  const handleLogoutAndRetry = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-gray-600">Cargando posiciones...</p>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Sesión expirada') || error.includes('token inválido');

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">❌ {error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={loadPositions}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
          {isAuthError && (
            <button
              onClick={handleLogoutAndRetry}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Iniciar Sesión Nuevamente
            </button>
          )}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">💼</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No hay posiciones de trabajo
        </h3>
        <p className="text-gray-600 mb-6">
          Crea tu primera posición para comenzar a analizar CVs
        </p>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ➕ Crear Primera Posición
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Posiciones de Trabajo ({positions.length})
        </h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Nueva Posición</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((position) => {
          const parsed = parseJobPosition(position);

          return (
            <div
              key={position.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{position.title}</h3>
                {position.department && (
                  <p className="text-sm text-gray-600">📍 {position.department}</p>
                )}
                {position.location && (
                  <p className="text-sm text-gray-500">🌍 {position.location}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">📊</span>
                  <span className="font-semibold">{position.total_analyses || 0}</span>
                  <span className="text-gray-500">análisis</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">👥</span>
                  <span className="font-semibold">{position.total_candidates_analyzed || 0}</span>
                  <span className="text-gray-500">candidatos</span>
                </div>
              </div>

              {/* Required Skills */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Habilidades Requeridas:</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.requiredSkills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                  {parsed.requiredSkills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{parsed.requiredSkills.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAnalyze(position)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  🚀 Analizar CVs
                </button>
                <button
                  onClick={() => handleViewAnalytics(position.id)}
                  className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => onEdit(position)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(position)}
                  className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
