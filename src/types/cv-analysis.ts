/**
 * CV Analysis Types
 * Extracted from Angular mv-admin project
 */

export interface Candidate {
  nombre: string;
  email: string;
  telefono: string;
  razonInteres?: string;
  habilidades?: string;
  descripcionAmigos?: string;
  porQueContratarme?: string;
  cvFile?: File;
}

export type CandidateCategory = 'entrevistar' | 'quizas' | 'descartar';

export interface CandidateScore {
  nombre: string;
  email: string;
  telefono: string;
  score: number;
  categoria: CandidateCategory;
  fortalezaPrincipal: string;
  banderaRoja: string;
  fortalezas?: string[];
  areasAtencion?: string[];
  consistencia?: string;
  preguntaSugerida?: string;
}

export interface AnalysisSummary {
  totalAnalizados: number;
  paraEntrevistar: number;
  quizas: number;
  descartados: number;
  top3: CandidateScore[];
}

export interface AnalysisResult {
  resumen: AnalysisSummary;
  candidatos: CandidateScore[];
  rawResponse?: unknown;
}

export type ProgressStep =
  | 'start'
  | 'upload'
  | 'excel'
  | 'pdfs'
  | 'prompt'
  | 'claude'
  | 'cleanup'
  | 'complete'
  | 'error'
  | 'warning';

export interface ProgressEvent {
  step: ProgressStep;
  message: string;
  candidatesCount?: number;
  total?: number;
  current?: number;
  progress?: number;
  error?: string;
  warning?: string;
  info?: string;
  successful?: number;
  failed?: number;
  promptSize?: number;
  promptSizeKB?: number;
}

export interface FinalResult {
  done: true;
  success: boolean;
  analysis?: AnalysisResult;
  metadata?: {
    totalCandidates: number;
    cvsProcessed: number;
    errors: number;
    promptSize: number;
    fileHash: string;
  };
  error?: string;
  details?: string;
}

export type SSEEvent = ProgressEvent | FinalResult;
