/**
 * Shared test mocks
 */
import { vi } from 'vitest';
import type { CandidateDetail } from '../types/analyses';
import type { JobPosition } from '../types/job-positions';

export const mockCandidate: CandidateDetail = {
  id: '1',
  analysisId: '1',
  nombre: 'Juan Perez',
  email: 'juan@test.com',
  telefono: '555-1234',
  score: 85,
  categoria: 'entrevistar',
  fortalezaPrincipal: 'Gran experiencia en React',
  banderaRoja: 'Ninguna',
  fortalezas: ['React', 'TypeScript'],
  areasAtencion: ['Poca experiencia en backend'],
  consistencia: 'Alta consistencia',
  preguntaSugerida: 'Describe tu experiencia con React hooks',
};

export const mockCandidates: CandidateDetail[] = [
  mockCandidate,
  {
    id: '2',
    analysisId: '1',
    nombre: 'Maria Lopez',
    email: 'maria@test.com',
    telefono: '555-5678',
    score: 72,
    categoria: 'quizas',
    fortalezaPrincipal: 'Buena actitud',
    banderaRoja: 'Poca experiencia',
    fortalezas: ['Comunicacion'],
    areasAtencion: ['Falta de experiencia tecnica'],
  },
  {
    id: '3',
    analysisId: '2',
    nombre: 'Carlos Garcia',
    email: 'carlos@test.com',
    telefono: '555-9999',
    score: 45,
    categoria: 'descartar',
    fortalezaPrincipal: 'Motivacion',
    banderaRoja: 'No cumple requisitos minimos',
  },
];

export const mockPosition: JobPosition = {
  id: 1,
  user_id: 1,
  title: 'Frontend Developer',
  department: 'Engineering',
  location: 'Remote',
  description: 'Senior frontend developer position',
  required_skills: '["React", "TypeScript", "CSS"]',
  desirable_skills: '["Node.js"]',
  red_flags: '["No experience"]',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const mockPositions: JobPosition[] = [
  mockPosition,
  {
    id: 2,
    user_id: 1,
    title: 'Backend Developer',
    department: 'Engineering',
    location: 'Office',
    description: 'Node.js backend developer',
    required_skills: '["Node.js", "PostgreSQL"]',
    desirable_skills: null,
    red_flags: null,
    is_active: true,
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  },
];

export const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

// Mock navigate
export const mockNavigate = vi.fn();

// Mock useAuth
export const mockLogin = vi.fn();
export const mockLogout = vi.fn();
export const mockAuth = {
  isAuthenticated: true,
  token: 'test-token',
  user: {
    id: 1,
    email: 'test@test.com',
    fullName: 'Test User',
    companyName: 'Test Co',
    licenseType: 'premium',
    licenseExpiresAt: null,
    totalAnalyses: 10,
    totalCandidatesProcessed: 50,
    createdAt: '2026-01-01',
    lastLogin: '2026-04-20',
    plan: 'premium' as const,
    monthlyLimit: 100,
    billingPeriodStart: '2026-04-01',
  },
  login: mockLogin,
  logout: mockLogout,
};
