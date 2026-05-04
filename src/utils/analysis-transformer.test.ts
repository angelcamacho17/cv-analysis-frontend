import { describe, it, expect } from 'vitest';
import { transformAnalysisResponse } from './analysis-transformer';

describe('transformAnalysisResponse', () => {
  describe('input shape handling', () => {
    it('handles wrapped object with candidates + summary (current backend SSE shape)', () => {
      const result = transformAnalysisResponse({
        candidates: [
          { name: 'Ana', email: 'ana@x.com', score: 90, category: 'interview' },
          { name: 'Bob', email: 'bob@x.com', score: 60, category: 'maybe' },
        ],
        summary: {
          totalAnalyzed: 2,
          toInterview: 1,
          maybe: 1,
          rejected: 0,
          top3: [{ name: 'Ana', score: 90, reason: 'Strong React' }],
        },
      });

      expect(result.candidatos).toHaveLength(2);
      expect(result.candidatos[0].nombre).toBe('Ana');
      expect(result.resumen.totalAnalizados).toBe(2);
      expect(result.resumen.paraEntrevistar).toBe(1);
      expect(result.resumen.quizas).toBe(1);
      expect(result.resumen.descartados).toBe(0);
      expect(result.resumen.top3[0].nombre).toBe('Ana');
      expect(result.resumen.top3[0].fortalezaPrincipal).toBe('Strong React');
    });

    it('handles legacy wrapped shape using `analysis` key', () => {
      const result = transformAnalysisResponse({
        analysis: [
          { name: 'Ana', score: 80, category: 'interview' },
        ],
      });

      expect(result.candidatos).toHaveLength(1);
      expect(result.candidatos[0].nombre).toBe('Ana');
    });

    it('handles bare-array shape', () => {
      const result = transformAnalysisResponse([
        { name: 'Ana', score: 80, category: 'interview' },
      ]);

      expect(result.candidatos).toHaveLength(1);
      expect(result.candidatos[0].nombre).toBe('Ana');
    });

    it('handles empty array', () => {
      const result = transformAnalysisResponse([]);
      expect(result.candidatos).toEqual([]);
      expect(result.resumen.totalAnalizados).toBe(0);
      expect(result.resumen.paraEntrevistar).toBe(0);
      expect(result.resumen.top3).toEqual([]);
    });

    it('handles empty object', () => {
      const result = transformAnalysisResponse({});
      expect(result.candidatos).toEqual([]);
      expect(result.resumen.totalAnalizados).toBe(0);
    });

    it('preserves rawResponse for debugging', () => {
      const input = { candidates: [], summary: {} };
      const result = transformAnalysisResponse(input);
      expect(result.rawResponse).toBe(input);
    });
  });

  describe('summary number fallbacks (regression: ?? vs ||)', () => {
    it('preserves real zero from backend instead of falling back to candidate count', () => {
      const result = transformAnalysisResponse({
        candidates: [
          { name: 'A', score: 50, category: 'interview' },
          { name: 'B', score: 50, category: 'interview' },
        ],
        summary: {
          totalAnalyzed: 2,
          toInterview: 0,
          maybe: 0,
          rejected: 0,
        },
      });

      expect(result.resumen.paraEntrevistar).toBe(0);
      expect(result.resumen.quizas).toBe(0);
      expect(result.resumen.descartados).toBe(0);
    });

    it('falls back to derived counts when summary is omitted', () => {
      const result = transformAnalysisResponse({
        candidates: [
          { name: 'A', category: 'interview' },
          { name: 'B', category: 'maybe' },
          { name: 'C', category: 'reject' },
          { name: 'D', category: 'reject' },
        ],
      });

      expect(result.resumen.totalAnalizados).toBe(4);
      expect(result.resumen.paraEntrevistar).toBe(1);
      expect(result.resumen.quizas).toBe(1);
      expect(result.resumen.descartados).toBe(2);
    });

    it('accepts snake_case summary keys', () => {
      const result = transformAnalysisResponse({
        candidates: [],
        summary: {
          total_analyzed: 7,
          to_interview: 3,
          top_3: [{ name: 'X', score: 90, reason: 'r' }],
        },
      });

      expect(result.resumen.totalAnalizados).toBe(7);
      expect(result.resumen.paraEntrevistar).toBe(3);
      expect(result.resumen.top3).toHaveLength(1);
    });
  });

  describe('candidate field mapping', () => {
    it('maps snake_case candidate fields to Spanish names', () => {
      const result = transformAnalysisResponse({
        candidates: [{
          name: 'Juan',
          email: 'j@x.com',
          phone: '555-1',
          score: 88,
          category: 'interview',
          main_strength: 'Backend',
          red_flag: 'Job hopper',
          strengths: ['Go', 'Postgres'],
          areas_of_concern: ['No frontend'],
          consistency: 'High',
          suggested_question: 'Tell me about Go runtime',
        }],
      });

      const c = result.candidatos[0];
      expect(c.nombre).toBe('Juan');
      expect(c.email).toBe('j@x.com');
      expect(c.telefono).toBe('555-1');
      expect(c.score).toBe(88);
      expect(c.categoria).toBe('entrevistar');
      expect(c.fortalezaPrincipal).toBe('Backend');
      expect(c.banderaRoja).toBe('Job hopper');
      expect(c.fortalezas).toEqual(['Go', 'Postgres']);
      expect(c.areasAtencion).toEqual(['No frontend']);
      expect(c.consistencia).toBe('High');
      expect(c.preguntaSugerida).toBe('Tell me about Go runtime');
    });

    it('maps camelCase candidate fields', () => {
      const result = transformAnalysisResponse({
        candidates: [{
          name: 'Ana',
          mainStrength: 'React',
          redFlag: 'None',
          areasOfConcern: ['Java'],
          suggestedQuestion: 'Why React?',
        }],
      });

      const c = result.candidatos[0];
      expect(c.fortalezaPrincipal).toBe('React');
      expect(c.banderaRoja).toBe('None');
      expect(c.areasAtencion).toEqual(['Java']);
      expect(c.preguntaSugerida).toBe('Why React?');
    });

    it('applies sensible defaults for missing fields', () => {
      const result = transformAnalysisResponse({ candidates: [{}] });
      const c = result.candidatos[0];
      expect(c.nombre).toBe('Desconocido');
      expect(c.email).toBe('No proporcionado');
      expect(c.telefono).toBe('No proporcionado');
      expect(c.score).toBe(0);
      expect(c.categoria).toBe('descartar');
      expect(c.banderaRoja).toBe('Ninguna');
      expect(c.fortalezas).toEqual([]);
      expect(c.areasAtencion).toEqual([]);
    });
  });

  describe('category mapping', () => {
    it('maps English categories to Spanish', () => {
      const result = transformAnalysisResponse({
        candidates: [
          { category: 'interview' },
          { category: 'maybe' },
          { category: 'reject' },
        ],
      });

      expect(result.candidatos.map(c => c.categoria)).toEqual([
        'entrevistar', 'quizas', 'descartar',
      ]);
    });

    it('passes through Spanish categories unchanged', () => {
      const result = transformAnalysisResponse({
        candidates: [
          { categoria: 'entrevistar' },
          { categoria: 'quizas' },
          { categoria: 'descartar' },
        ],
      });

      expect(result.candidatos.map(c => c.categoria)).toEqual([
        'entrevistar', 'quizas', 'descartar',
      ]);
    });

    it('defaults unknown categories to descartar (current behavior)', () => {
      const result = transformAnalysisResponse({
        candidates: [{ category: 'something_new' }],
      });
      expect(result.candidatos[0].categoria).toBe('descartar');
    });
  });

  describe('top3 mapping', () => {
    it('maps top3 with English `reason` field', () => {
      const result = transformAnalysisResponse({
        candidates: [],
        summary: {
          top3: [
            { name: 'A', score: 95, reason: 'Top reason' },
            { name: 'B', score: 90, reason: 'Second' },
          ],
        },
      });

      expect(result.resumen.top3).toHaveLength(2);
      expect(result.resumen.top3[0]).toMatchObject({
        nombre: 'A', score: 95, fortalezaPrincipal: 'Top reason',
      });
    });

    it('falls back to mainStrength / main_strength when reason absent', () => {
      const result = transformAnalysisResponse({
        candidates: [],
        summary: {
          top3: [
            { name: 'A', score: 90, mainStrength: 'camel' },
            { name: 'B', score: 80, main_strength: 'snake' },
          ],
        },
      });

      expect(result.resumen.top3[0].fortalezaPrincipal).toBe('camel');
      expect(result.resumen.top3[1].fortalezaPrincipal).toBe('snake');
    });

    it('returns empty top3 when summary omits it', () => {
      const result = transformAnalysisResponse({ candidates: [] });
      expect(result.resumen.top3).toEqual([]);
    });
  });
});
