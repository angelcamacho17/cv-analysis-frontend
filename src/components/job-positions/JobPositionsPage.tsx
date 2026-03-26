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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Posiciones de Trabajo</h1>
        <p className="text-sm text-gray-500">
          Gestiona las posiciones de trabajo para analizar candidatos especificos para cada rol
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
  );
};
