import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVAnalysisPage } from './CVAnalysisPage';
import { mockPositions } from '../../test/mocks';

// Mock services
vi.mock('../../services/cv-analysis.service', () => ({
  analyzeCVWithProgress: vi.fn(),
}));

vi.mock('../../services/job-positions.service', () => ({
  getJobPositions: vi.fn(),
}));

vi.mock('../../services/usage.service', () => ({
  getUsage: vi.fn(),
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

// Mock window.scrollTo
window.scrollTo = vi.fn();

import { getJobPositions } from '../../services/job-positions.service';
import { getUsage } from '../../services/usage.service';

describe('CVAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getJobPositions as any).mockResolvedValue(mockPositions);
    (getUsage as any).mockResolvedValue({
      used: 5,
      limit: 100,
      remaining: 95,
      plan: 'premium',
      billingPeriodStart: '2026-04-01',
      billingPeriodEnd: '2026-05-01',
    });
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <CVAnalysisPage />
      </MemoryRouter>
    );
  };

  it('renders page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Analisis de CVs/i)).toBeInTheDocument();
    });
  });

  it('loads and shows job positions', async () => {
    renderPage();
    await waitFor(() => {
      expect(getJobPositions).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/Frontend Developer/)).toBeInTheDocument();
    });
  });

  it('shows file upload area with drag and drop hint', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Arrastra archivos PDF/i)).toBeInTheDocument();
    });
  });

  it('has a file input for PDFs', async () => {
    renderPage();
    await waitFor(() => {
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('accept', '.pdf');
    });
  });

  it('shows usage information', async () => {
    renderPage();
    await waitFor(() => {
      expect(getUsage).toHaveBeenCalled();
    });
  });

  it('accepts PDF files and shows file names', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    const file = new File(['dummy'], 'resume.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    });
  });
});
