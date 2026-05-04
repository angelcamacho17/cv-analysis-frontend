import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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

  // -------- End-to-end analysis flow (Layer 3 of test plan) --------
  // These exercise the full chain: mocked SSE final event -> transformer -> rendered DOM.
  // They are the regression tests for the "summary all zeros" bug.

  /**
   * Drives the page through: select position -> upload file -> click Analizar.
   * The caller supplies the FinalResult that the mocked service will deliver.
   */
  const runAnalysisWith = async (finalResult: any) => {
    const { analyzeCVWithProgress } = await import('../../services/cv-analysis.service');
    (analyzeCVWithProgress as any).mockImplementation(
      async (
        _positionId: number,
        _files: File[],
        _onProgress: (e: any) => void,
        onComplete: (e: any) => void,
      ) => {
        onComplete(finalResult);
      },
    );

    renderPage();

    // Wait for positions to load, then select one.
    await waitFor(() => {
      expect(screen.getByText(/Frontend Developer/)).toBeInTheDocument();
    });
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: String(mockPositions[0].id) } });

    // Upload one PDF.
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    // Click Analizar.
    const analyzeBtn = await screen.findByRole('button', { name: /Analizar/i });
    fireEvent.click(analyzeBtn);
  };

  it('renders summary numbers from a successful analysis', async () => {
    await runAnalysisWith({
      done: true,
      success: true,
      analysis: {
        candidates: [
          { name: 'Ana', email: 'ana@x.com', score: 90, category: 'interview', main_strength: 'React', red_flag: 'None' },
          { name: 'Bob', email: 'bob@x.com', score: 60, category: 'maybe', main_strength: 'JS', red_flag: 'Junior' },
          { name: 'Carl', email: 'carl@x.com', score: 30, category: 'reject', main_strength: 'Eager', red_flag: 'No exp' },
        ],
        summary: {
          totalAnalyzed: 3,
          toInterview: 1,
          maybe: 1,
          rejected: 1,
          top3: [{ name: 'Ana', score: 90, reason: 'Strong React' }],
        },
      },
    });

    // Wait until the Resumen heading appears (means analysisResult was set).
    const resumen = await screen.findByText('Resumen');
    const summarySection = resumen.parentElement as HTMLElement;

    // Each stat card uses `text-3xl font-bold ...` for the number; assert the labels and values.
    expect(within(summarySection).getByText('Total')).toBeInTheDocument();
    expect(within(summarySection).getByText('Entrevistar')).toBeInTheDocument();
    expect(within(summarySection).getByText('Quizas')).toBeInTheDocument();
    expect(within(summarySection).getByText('Descartados')).toBeInTheDocument();

    // Each value should appear in the summary section.
    // Total = 3, the rest = 1 each.
    const numbers = within(summarySection).getAllByText('1');
    expect(numbers.length).toBeGreaterThanOrEqual(3); // entrevistar + quizas + descartados
    expect(within(summarySection).getByText('3')).toBeInTheDocument();
  });

  it('renders candidate cards below the summary', async () => {
    await runAnalysisWith({
      done: true,
      success: true,
      analysis: {
        candidates: [
          { name: 'Ana', email: 'ana@x.com', score: 90, category: 'interview', main_strength: 'React', red_flag: 'None' },
          { name: 'Bob', email: 'bob@x.com', score: 60, category: 'maybe', main_strength: 'JS', red_flag: 'Junior' },
        ],
        summary: { totalAnalyzed: 2, toInterview: 1, maybe: 1, rejected: 0, top3: [] },
      },
    });

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('renders a real zero from the backend (regression: ?? not ||)', async () => {
    // The backend says 0 should be interviewed even though there are 2 interview-category candidates.
    // The OLD `||` logic would overwrite 0 with the candidate-count fallback (2). The new `??` logic preserves 0.
    await runAnalysisWith({
      done: true,
      success: true,
      analysis: {
        candidates: [
          { name: 'Ana', score: 50, category: 'interview' },
          { name: 'Bob', score: 50, category: 'interview' },
        ],
        summary: {
          totalAnalyzed: 2,
          toInterview: 0,
          maybe: 0,
          rejected: 0,
          top3: [],
        },
      },
    });

    const resumen = await screen.findByText('Resumen');
    const summarySection = resumen.parentElement as HTMLElement;

    // Three category cards must show 0, not 2.
    const zeros = within(summarySection).getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });

  it('shows empty summary numbers when no candidates were returned', async () => {
    await runAnalysisWith({
      done: true,
      success: true,
      analysis: {
        candidates: [],
        summary: { totalAnalyzed: 0, toInterview: 0, maybe: 0, rejected: 0, top3: [] },
      },
    });

    const resumen = await screen.findByText('Resumen');
    const summarySection = resumen.parentElement as HTMLElement;
    const zeros = within(summarySection).getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4); // total + 3 categories
  });

  it('shows the limit-reached error when the backend rejects with quota info', async () => {
    await runAnalysisWith({
      done: true,
      success: false,
      limit: 100,
      used: 100,
      billingPeriodEnd: '2026-06-01',
      plan: 'free',
    });

    expect(await screen.findByText(/Limite mensual alcanzado/i)).toBeInTheDocument();
    expect(screen.getByText(/100\/100 CVs/)).toBeInTheDocument();
    expect(screen.getByText(/Actualiza a Premium/i)).toBeInTheDocument();
  });

  it('filters candidate cards when a category filter is clicked', async () => {
    await runAnalysisWith({
      done: true,
      success: true,
      analysis: {
        candidates: [
          { name: 'Ana', score: 90, category: 'interview' },
          { name: 'Bob', score: 60, category: 'maybe' },
          { name: 'Carl', score: 30, category: 'reject' },
        ],
        summary: { totalAnalyzed: 3, toInterview: 1, maybe: 1, rejected: 1, top3: [] },
      },
    });

    // All three visible by default.
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carl')).toBeInTheDocument();

    // Click the "Entrevistar (1)" filter button.
    const entrevistarBtn = screen.getByRole('button', { name: /Entrevistar \(1\)/ });
    fireEvent.click(entrevistarBtn);

    // Ana stays, Bob and Carl are gone.
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('Carl')).not.toBeInTheDocument();
  });
});
