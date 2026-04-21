import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchCandidates, getTopCandidates } from './analyses.service';

// Mock api-client
vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from './api-client';

describe('analyses.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchCandidates', () => {
    it('calls API with correct query params', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith('/candidates/search?page=1&limit=10');
    });

    it('maps category from Spanish to English', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ category: 'entrevistar', page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('category=interview')
      );
    });

    it('maps quizas to maybe', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ category: 'quizas', page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('category=maybe')
      );
    });

    it('maps descartar to reject', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ category: 'descartar', page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('category=reject')
      );
    });

    it('sends jobPositionId as number', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ jobPositionId: 5, page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('jobPositionId=5')
      );
    });

    it('sends minScore and maxScore', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ minScore: 50, maxScore: 90, page: 1, limit: 10 });

      const url = (apiGet as any).mock.calls[0][0];
      expect(url).toContain('minScore=50');
      expect(url).toContain('maxScore=90');
    });

    it('transforms backend candidates to frontend format', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [
          {
            id: 1,
            analysis_id: 10,
            name: 'Test User',
            email: 'test@test.com',
            phone: '555-0000',
            score: 80,
            category: 'interview',
            main_strength: 'Good at React',
            red_flag: 'None',
            strengths: ['React'],
            areas_of_concern: ['Backend'],
            consistency: 'High',
            suggested_question: 'Tell me about React',
          },
        ],
        count: 1,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await searchCandidates({ page: 1, limit: 10 });

      expect(result.data[0].nombre).toBe('Test User');
      expect(result.data[0].categoria).toBe('entrevistar');
      expect(result.data[0].fortalezaPrincipal).toBe('Good at React');
      expect(result.data[0].banderaRoja).toBe('None');
      expect(result.data[0].fortalezas).toEqual(['React']);
      expect(result.data[0].areasAtencion).toEqual(['Backend']);
    });

    it('returns pagination from response', async () => {
      const pag = { page: 2, limit: 10, total: 25, totalPages: 3 };
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: pag,
      });

      const result = await searchCandidates({ page: 2, limit: 10 });

      expect(result.pagination).toEqual(pag);
    });

    it('does not send category=all', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await searchCandidates({ category: 'all', page: 1, limit: 10 });

      expect(apiGet).toHaveBeenCalledWith('/candidates/search?page=1&limit=10');
    });
  });

  describe('getTopCandidates', () => {
    it('calls API with page and limit', async () => {
      (apiGet as any).mockResolvedValue({
        success: true,
        candidates: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await getTopCandidates(2, 5);

      expect(apiGet).toHaveBeenCalledWith('/candidates/top?page=2&limit=5');
    });
  });
});
