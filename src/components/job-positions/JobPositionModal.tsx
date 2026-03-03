/**
 * Job Position Modal Component
 * Create/Edit job position form in a modal
 */

import { useState, useEffect, KeyboardEvent } from 'react';
import { createJobPosition, updateJobPosition } from '../../services/job-positions.service';
import { parseJobPosition } from '../../types/job-positions';
import type { JobPosition, JobPositionCreateRequest, JobPositionUpdateRequest } from '../../types/job-positions';

interface JobPositionModalProps {
  position?: JobPosition | null;
  onClose: () => void;
  onSave: () => void;
}

export const JobPositionModal = ({ position, onClose, onSave }: JobPositionModalProps) => {
  const isEdit = !!position;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requiredSkills: [] as string[],
    desirableSkills: [] as string[],
    redFlags: [] as string[],
  });

  // Input states for adding new items
  const [newSkill, setNewSkill] = useState('');
  const [newDesirable, setNewDesirable] = useState('');
  const [newRedFlag, setNewRedFlag] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when editing
  useEffect(() => {
    if (position) {
      const parsed = parseJobPosition(position);
      setFormData({
        title: position.title,
        department: position.department || '',
        location: position.location || '',
        description: position.description,
        requiredSkills: parsed.requiredSkills,
        desirableSkills: parsed.desirableSkills,
        redFlags: parsed.redFlags,
      });
    }
  }, [position]);

  const addItem = (type: 'required' | 'desirable' | 'redFlag') => {
    const value = type === 'required' ? newSkill : type === 'desirable' ? newDesirable : newRedFlag;

    if (!value.trim()) return;

    const field = type === 'required' ? 'requiredSkills' : type === 'desirable' ? 'desirableSkills' : 'redFlags';

    // Check for duplicates
    if (formData[field].includes(value.trim())) {
      alert('Este ítem ya existe');
      return;
    }

    setFormData({
      ...formData,
      [field]: [...formData[field], value.trim()],
    });

    // Clear input
    if (type === 'required') setNewSkill('');
    else if (type === 'desirable') setNewDesirable('');
    else setNewRedFlag('');
  };

  const removeItem = (field: 'requiredSkills' | 'desirableSkills' | 'redFlags', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, type: 'required' | 'desirable' | 'redFlag') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('El título es obligatorio');
      }
      if (!formData.description.trim()) {
        throw new Error('La descripción es obligatoria');
      }
      if (formData.requiredSkills.length === 0) {
        throw new Error('Debes agregar al menos una habilidad requerida');
      }

      const payload: JobPositionCreateRequest | JobPositionUpdateRequest = {
        title: formData.title.trim(),
        department: formData.department.trim() || null,
        location: formData.location.trim() || null,
        description: formData.description.trim(),
        requiredSkills: formData.requiredSkills,
        desirableSkills: formData.desirableSkills,
        redFlags: formData.redFlags,
      };

      if (isEdit && position) {
        await updateJobPosition(position.id, payload);
      } else {
        await createJobPosition(payload as JobPositionCreateRequest);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar' : 'Crear'} Posición
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              ❌ {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ej. Desarrollador Backend Senior"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Department & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="ej. Ingeniería"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="ej. Remoto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el rol, responsabilidades y el candidato ideal..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Habilidades Requeridas * (presiona Enter para agregar)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'required')}
                placeholder="ej. Python"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addItem('required')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeItem('requiredSkills', idx)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Desirable Skills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Habilidades Deseables (presiona Enter para agregar)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDesirable}
                onChange={(e) => setNewDesirable(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'desirable')}
                placeholder="ej. Docker"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addItem('desirable')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.desirableSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeItem('desirableSkills', idx)}
                    className="text-orange-600 hover:text-orange-800 font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Banderas Rojas (presiona Enter para agregar)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newRedFlag}
                onChange={(e) => setNewRedFlag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'redFlag')}
                placeholder="ej. Sin experiencia profesional"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addItem('redFlag')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.redFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2"
                >
                  {flag}
                  <button
                    type="button"
                    onClick={() => removeItem('redFlags', idx)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEdit ? 'Actualizar' : 'Crear'} Posición</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
