/**
 * Job Positions Page
 * Main page for managing job positions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobPositionsList } from './JobPositionsList';
import { JobPositionModal } from './JobPositionModal';
import type { JobPosition } from '../../types/job-positions';

export const JobPositionsPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateNew = () => {
    setEditingPosition(null);
    setShowModal(true);
  };

  const handleEdit = (position: JobPosition) => {
    setEditingPosition(position);
    setShowModal(true);
  };

  const handleAnalyze = (position: JobPosition) => {
    // Navigate to CV analysis page with position pre-selected
    navigate('/', { state: { selectedPositionId: position.id } });
  };

  const handleSave = () => {
    // Refresh the list after save
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosition(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Posiciones de Trabajo</h1>
          <p className="text-gray-600">
            Gestiona las posiciones de trabajo para analizar candidatos específicos para cada rol
          </p>
        </div>

        <JobPositionsList
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onAnalyze={handleAnalyze}
          refreshTrigger={refreshTrigger}
        />

        {showModal && (
          <JobPositionModal
            position={editingPosition}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};
