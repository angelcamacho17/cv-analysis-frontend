import { describe, it, expect } from 'vitest';
import {
  transformCandidate,
  transformStatistics,
  transformAnalysisSummary,
  transformAnalysisDetail,
} from './analyses-transformer';

describe('analyses-transformer', () => {
  describe('transformCandidate', () => {
    it('transforms snake_case backend response to camelCase', () => {
      const result = transformCandidate({
        id: 1,
        analysis_id: 10,
        name: 'Juan Perez',
        email: 'juan@test.com',
        phone: '555-1234',
        score: 85,
        category: 'interview',
        main_strength: 'React expert',
        red_flag: 'None',
        strengths: ['React', 'TS'],
        areas_of_concern: ['Backend'],
        consistency: 'High',
        suggested_question: 'Tell me about React',
      });

      expect(result.id).toBe('1');
      expect(result.analysisId).toBe('10');
      expect(result.nombre).toBe('Juan Perez');
      expect(result.email).toBe('juan@test.com');
      expect(result.telefono).toBe('555-1234');
      expect(result.score).toBe(85);
      expect(result.categoria).toBe('entrevistar');
      expect(result.fortalezaPrincipal).toBe('React expert');
      expect(result.banderaRoja).toBe('None');
      expect(result.fortalezas).toEqual(['React', 'TS']);
      expect(result.areasAtencion).toEqual(['Backend']);
      expect(result.consistencia).toBe('High');
      expect(result.preguntaSugerida).toBe('Tell me about React');
    });

    it('maps interview category to entrevistar', () => {
      const result = transformCandidate({ category: 'interview' });
      expect(result.categoria).toBe('entrevistar');
    });

    it('maps maybe category to quizas', () => {
      const result = transformCandidate({ category: 'maybe' });
      expect(result.categoria).toBe('quizas');
    });

    it('maps reject category to descartar', () => {
      const result = transformCandidate({ category: 'reject' });
      expect(result.categoria).toBe('descartar');
    });

    it('maps discard category to descartar', () => {
      const result = transformCandidate({ category: 'discard' });
      expect(result.categoria).toBe('descartar');
    });

    it('handles already-Spanish categories', () => {
      expect(transformCandidate({ category: 'entrevistar' }).categoria).toBe('entrevistar');
      expect(transformCandidate({ category: 'quizas' }).categoria).toBe('quizas');
      expect(transformCandidate({ category: 'descartar' }).categoria).toBe('descartar');
    });

    it('defaults unknown category to descartar', () => {
      const result = transformCandidate({ category: 'unknown' });
      expect(result.categoria).toBe('descartar');
    });

    it('handles missing fields with defaults', () => {
      const result = transformCandidate({});
      expect(result.nombre).toBe('Desconocido');
      expect(result.email).toBe('No proporcionado');
      expect(result.telefono).toBe('No proporcionado');
      expect(result.score).toBe(0);
      expect(result.banderaRoja).toBe('Ninguna');
      expect(result.fortalezas).toEqual([]);
      expect(result.areasAtencion).toEqual([]);
    });

    it('handles camelCase backend response (full_data format)', () => {
      const result = transformCandidate({
        nombre: 'Maria',
        telefono: '999',
        categoria: 'entrevistar',
        fortalezaPrincipal: 'Leadership',
        banderaRoja: 'None',
        fortalezas: ['A'],
        areasAtencion: ['B'],
      });

      expect(result.nombre).toBe('Maria');
      expect(result.telefono).toBe('999');
      expect(result.fortalezaPrincipal).toBe('Leadership');
    });
  });

  describe('transformStatistics', () => {
    it('transforms backend statistics response', () => {
      const result = transformStatistics({
        statistics: {
          total_analyses: '15',
          total_candidates_analyzed: '120',
          candidates_to_interview: '40',
          average_score: '72.5',
          candidates_maybe: '50',
          candidates_rejected: '30',
        },
      });

      expect(result.totalAnalyses).toBe(15);
      expect(result.totalCandidates).toBe(120);
      expect(result.candidatesToInterview).toBe(40);
      expect(result.averageScore).toBe(72.5);
      expect(result.categoryDistribution.entrevistar).toBe(40);
      expect(result.categoryDistribution.quizas).toBe(50);
      expect(result.categoryDistribution.descartar).toBe(30);
    });

    it('handles missing statistics with defaults', () => {
      const result = transformStatistics({});
      expect(result.totalAnalyses).toBe(0);
      expect(result.totalCandidates).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });

  describe('transformAnalysisSummary', () => {
    it('transforms backend analysis summary', () => {
      const result = transformAnalysisSummary({
        id: 5,
        excel_file_name: 'resumes.xlsx',
        analysis_date: '2026-04-01T00:00:00Z',
        total_candidates: 10,
        summary: {
          totalAnalizados: 10,
          paraEntrevistar: 4,
          quizas: 3,
          descartados: 3,
        },
        total_cvs_processed: 10,
        total_cvs_with_errors: 0,
      });

      expect(result.id).toBe('5');
      expect(result.excelFilename).toBe('resumes.xlsx');
      expect(result.totalCandidates).toBe(10);
      expect(result.paraEntrevistar).toBe(4);
      expect(result.quizas).toBe(3);
      expect(result.descartados).toBe(3);
    });

    it('handles camelCase field names', () => {
      const result = transformAnalysisSummary({
        id: 1,
        excelFilename: 'test.xlsx',
        analysisDate: '2026-01-01',
        totalCandidates: 5,
      });

      expect(result.excelFilename).toBe('test.xlsx');
    });
  });

  describe('transformAnalysisDetail', () => {
    it('transforms full analysis detail response', () => {
      const result = transformAnalysisDetail({
        id: 1,
        excel_file_name: 'test.xlsx',
        analysis_date: '2026-04-01',
        summary: {
          totalAnalyzed: 5,
          toInterview: 2,
          maybe: 2,
          rejected: 1,
          top3: [
            { name: 'Top1', email: 'top1@test.com', score: 90, category: 'interview', reason: 'Best' },
          ],
        },
        candidates: [
          { id: 1, name: 'Test', email: 'test@test.com', score: 80, category: 'interview' },
        ],
        total_candidates: 5,
        total_cvs_processed: 5,
      });

      expect(result.id).toBe('1');
      expect(result.summary.totalAnalizados).toBe(5);
      expect(result.summary.paraEntrevistar).toBe(2);
      expect(result.summary.quizas).toBe(2);
      expect(result.summary.descartados).toBe(1);
      expect(result.summary.top3).toHaveLength(1);
      expect(result.summary.top3[0].nombre).toBe('Top1');
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].nombre).toBe('Test');
    });

    it('handles missing summary and candidates', () => {
      const result = transformAnalysisDetail({
        id: 1,
        excel_file_name: 'test.xlsx',
        analysis_date: '2026-04-01',
      });

      expect(result.summary.totalAnalizados).toBe(0);
      expect(result.summary.top3).toEqual([]);
      expect(result.candidates).toEqual([]);
    });
  });
});
