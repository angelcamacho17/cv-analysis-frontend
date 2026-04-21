import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PositionAnalytics } from './PositionAnalytics';
import { mockCandidates } from '../../test/mocks';

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock services
vi.mock('../../services/job-positions.service', () => ({
  getPositionAnalytics: vi.fn(),
  getPositionAnalyses: vi.fn(),
}));

vi.mock('../../services/analyses.service', () => ({
  searchCandidates: vi.fn(),
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

import { getPositionAnalytics, getPositionAnalyses } from '../../services/job-positions.service';
import { searchCandidates } from '../../services/analyses.service';

const mockAnalytics = {
  success: true,
  position: {
    id: 1,
    user_id: 1,
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    description: 'Frontend role',
    required_skills: '["React", "TypeScript"]',
    desirable_skills: null,
    red_flags: null,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  analytics: {
    totalAnalyses: 2,
    totalCandidatesAnalyzed: 20,
    candidatesToInterview: 8,
    candidatesMaybe: 7,
    candidatesRejected: 5,
    averageScore: 70,
    highestScore: 95,
    lowestScore: 30,
    firstAnalysisDate: '2026-03-01',
    lastAnalysisDate: '2026-04-01',
    topCandidates: [],
  },
};

const mockAnalyses = {
  success: true,
  position: mockAnalytics.position,
  analyses: [
    {
      id: 1,
      analysis_date: '2026-04-01',
      excel_file_name: 'batch1.xlsx',
      total_candidates: 10,
      total_cvs_processed: 10,
      summary: { totalAnalizados: 10, paraEntrevistar: 4, quizas: 3, descartados: 3 },
    },
  ],
  pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

const renderWithRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/positions/1/analytics']}>
      <Routes>
        <Route path="/positions/:id/analytics" element={<PositionAnalytics />} />
        <Route path="/positions" element={<div>Positions List</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PositionAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getPositionAnalytics as any).mockResolvedValue(mockAnalytics);
    (getPositionAnalyses as any).mockResolvedValue(mockAnalyses);
    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: mockCandidates,
      count: 3,
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });
  });

  it('renders position title', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });
  });

  it('shows required skills', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Habilidades Requeridas:')).toBeInTheDocument();
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    });
  });

  it('shows stats cards', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument(); // total candidates
      expect(screen.getByText('8')).toBeInTheDocument(); // to interview
      expect(screen.getByText('7')).toBeInTheDocument(); // maybe
      expect(screen.getByText('5')).toBeInTheDocument(); // rejected
    });
  });

  it('renders candidates list', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
      expect(screen.getByText('Carlos Garcia')).toBeInTheDocument();
    });
  });

  it('shows candidate section header', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
  });

  it('filters by category when clicking stat card', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Find the stat card label (uppercase text in the stats grid)
    const statLabels = screen.getAllByText('Entrevistar');
    // The first one is in the stat card (uppercase styled)
    fireEvent.click(statLabels[0]);

    await waitFor(() => {
      // After clicking, "Filtro activo" should appear under the Entrevistar card
      const filtroTexts = screen.getAllByText('Filtro activo');
      expect(filtroTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows active filter indicator when category selected', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Click the first "Quizas" text (stat card)
    fireEvent.click(screen.getAllByText('Quizas')[0]);

    await waitFor(() => {
      expect(screen.getByText('Filtros:')).toBeInTheDocument();
    });
  });

  it('shows analyses section', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Analisis Realizados')).toBeInTheDocument();
    });
  });

  it('expands analyses section on click', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Analisis Realizados')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Analisis Realizados'));

    await waitFor(() => {
      expect(screen.getByText(/batch1.xlsx/)).toBeInTheDocument();
    });
  });

  it('shows search input for candidates', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o email/i)).toBeInTheDocument();
    });
  });

  it('filters candidates by search text', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'Juan' } });

    await waitFor(() => {
      expect(searchCandidates).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Juan' })
      );
    });
  });

  it('shows back button to positions', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Posiciones')).toBeInTheDocument();
    });
  });

  it('shows error state when loading fails', async () => {
    (getPositionAnalytics as any).mockRejectedValue(new Error('API error'));
    (getPositionAnalyses as any).mockRejectedValue(new Error('API error'));

    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar|API error/i)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    renderWithRoute();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows pagination when many candidates', async () => {
    const manyCandidates = Array.from({ length: 15 }, (_, i) => ({
      ...mockCandidates[0],
      id: String(i + 100),
      nombre: `Candidate ${i}`,
    }));

    (searchCandidates as any).mockResolvedValue({
      success: true,
      data: manyCandidates,
      count: 15,
      pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
    });

    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText(/Pagina 1 de 2/)).toBeInTheDocument();
    });
  });
});
