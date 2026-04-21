import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandidatesDashboard } from './CandidatesDashboard';
import { mockCandidates, mockPositions, mockPagination } from '../../test/mocks';

// Mock services
vi.mock('../../services/analyses.service', () => ({
  searchCandidates: vi.fn(),
}));

vi.mock('../../services/job-positions.service', () => ({
  getJobPositions: vi.fn(),
}));

// Mock auth context
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: 'test-token',
    user: { plan: 'premium', monthlyLimit: 100 },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { searchCandidates } from '../../services/analyses.service';
import { getJobPositions } from '../../services/job-positions.service';

const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <CandidatesDashboard />
    </MemoryRouter>
  );
};

describe('CandidatesDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getJobPositions as any).mockResolvedValue(mockPositions);
    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: mockCandidates,
      count: 3,
      pagination: mockPagination,
    });
  });

  it('renders loading state initially', () => {
    renderDashboard();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders candidates after loading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Garcia')).toBeInTheDocument();
  });

  it('shows candidate count', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 3 de 3 candidatos/)).toBeInTheDocument();
    });
  });

  it('calls searchCandidates with correct params', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(searchCandidates).toHaveBeenCalledWith({
        jobPositionId: undefined,
        category: undefined,
        minScore: undefined,
        maxScore: undefined,
      });
    });
  });

  it('filters by position', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const positionSelect = screen.getByDisplayValue('Todas las posiciones');
    fireEvent.change(positionSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(searchCandidates).toHaveBeenCalledWith(
        expect.objectContaining({ jobPositionId: 1 })
      );
    });
  });

  it('filters by category', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('Todas');
    fireEvent.change(categorySelect, { target: { value: 'entrevistar' } });

    await waitFor(() => {
      expect(searchCandidates).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'entrevistar' })
      );
    });
  });

  it('filters by score range', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const minInput = screen.getByPlaceholderText('Min');
    fireEvent.change(minInput, { target: { value: '70' } });

    await waitFor(() => {
      expect(searchCandidates).toHaveBeenCalledWith(
        expect.objectContaining({ minScore: 70 })
      );
    });
  });

  it('clears filters', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Apply a filter first
    const categorySelect = screen.getByDisplayValue('Todas');
    fireEvent.change(categorySelect, { target: { value: 'entrevistar' } });

    await waitFor(() => {
      expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Limpiar filtros'));

    await waitFor(() => {
      expect(searchCandidates).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: undefined })
      );
    });
  });

  it('shows candidate detail on click', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Juan Perez'));

    await waitFor(() => {
      expect(screen.getByText('Gran experiencia en React')).toBeInTheDocument();
      expect(screen.getByText('Volver')).toBeInTheDocument();
    });
  });

  it('shows empty state when no candidates', async () => {
    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Aun no hay candidatos analizados/)).toBeInTheDocument();
    });
  });

  it('shows pagination when multiple pages', async () => {
    const manyCandidates = Array.from({ length: 25 }, (_, i) => ({
      ...mockCandidates[0],
      id: String(i + 10),
      nombre: `Candidate ${i}`,
    }));

    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: manyCandidates,
      count: 25,
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
    });

    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Mostrando 10 de 25 candidatos')).toBeInTheDocument();
      expect(screen.getByText('Pagina 1 de 3')).toBeInTheDocument();
    });
  });

  it('navigates pages', async () => {
    const manyCandidates = Array.from({ length: 15 }, (_, i) => ({
      ...mockCandidates[0],
      id: String(i + 10),
      nombre: `Candidate ${i}`,
    }));

    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: manyCandidates,
      count: 15,
      pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
    });

    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Pagina 1 de 2')).toBeInTheDocument();
    });

    // Click page 2 button
    const page2Button = screen.getAllByRole('button').find(b => b.textContent === '2');
    expect(page2Button).toBeTruthy();
    fireEvent.click(page2Button!);

    await waitFor(() => {
      expect(screen.getByText('Pagina 2 de 2')).toBeInTheDocument();
    });
  });
});
