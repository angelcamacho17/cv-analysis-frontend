import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobPositionsPage } from './JobPositionsPage';
import { mockPositions } from '../../test/mocks';

// Mock services
vi.mock('../../services/job-positions.service', () => ({
  getJobPositions: vi.fn(),
  createJobPosition: vi.fn(),
  updateJobPosition: vi.fn(),
  deleteJobPosition: vi.fn(),
  duplicateJobPosition: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: 'test-token',
    user: { plan: 'premium', monthlyLimit: 100 },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { getJobPositions } from '../../services/job-positions.service';

describe('JobPositionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getJobPositions as any).mockResolvedValue(mockPositions);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <JobPositionsPage />
      </MemoryRouter>
    );
  };

  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Posiciones de Trabajo')).toBeInTheDocument();
  });

  it('renders position list after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    });
  });

  it('shows create button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByText(/Nueva Posicion/i);
    expect(createButtons.length).toBeGreaterThan(0);
  });

  it('loads positions from API', async () => {
    renderPage();
    await waitFor(() => {
      expect(getJobPositions).toHaveBeenCalled();
    });
  });

  it('shows empty state when no positions', async () => {
    (getJobPositions as any).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No hay posiciones|Crea tu primera posicion/i)).toBeInTheDocument();
    });
  });
});
