/**
 * CV Analysis Page Component (v5.0.0)
 * Improved UX: drag & drop, file management, collapsible info, better hierarchy
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyzeCVWithProgress } from '../../services/cv-analysis.service';
import { getJobPositions } from '../../services/job-positions.service';
import { getUsage, type UsageData } from '../../services/usage.service';
import { parseJobPosition } from '../../types/job-positions';
import { JobPositionModal } from '../job-positions/JobPositionModal';
import { transformAnalysisResponse } from '../../utils/analysis-transformer';
import type { JobPosition } from '../../types/job-positions';
import type {
  AnalysisResult,
  CandidateScore,
  SSEEvent,
  FinalResult,
  ProgressEvent,
  CandidateCategory,
} from '../../types/cv-analysis';

type FilterCategory = 'todos' | CandidateCategory;

export const CVAnalysisPage = () => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job Position Selection
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Form data
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('todos');
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);

  // Progress tracking
  const [currentStep, setCurrentStep] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([]);

  useEffect(() => {
    loadJobPositions();
    loadUsage();
  }, []);

  useEffect(() => {
    if (location.state?.selectedPositionId) {
      setSelectedPositionId(location.state.selectedPositionId);
    }
  }, [location.state]);

  const loadJobPositions = async () => {
    try {
      setLoadingPositions(true);
      setError(null);
      const data = await getJobPositions({ active: true });
      setPositions(data);
      if (data.length === 1) {
        setSelectedPositionId(data[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar posiciones';
      setError(errorMessage);
    } finally {
      setLoadingPositions(false);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await getUsage();
      setUsage(data);
    } catch (err) {
      console.error('Error loading usage:', err);
    }
  };

  const canAnalyze = pdfFiles.length > 0 && !!selectedPositionId;

  // File handling
  const addFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const invalidCount = files.length - validFiles.length;

    if (invalidCount > 0) {
      setError(`${invalidCount} archivo(s) ignorado(s) - solo se permiten PDFs`);
    }

    setPdfFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > 50) {
        setError('Maximo 50 archivos PDF permitidos');
        return prev;
      }
      if (validFiles.length > 0) setError(null);
      return combined;
    });
  }, []);

  const removeFile = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setPdfFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onPdfFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const updateProgressPercentage = (event: ProgressEvent) => {
    if (event.progress !== undefined) {
      setProgressPercentage(event.progress);
      return;
    }
    const stepProgress: Record<string, number> = {
      start: 5, upload: 10, excel: 20, pdfs: 50,
      prompt: 60, claude: 90, cleanup: 95, complete: 100,
    };
    setProgressPercentage(stepProgress[event.step] || progressPercentage);
  };

  const analyzeResumes = async () => {
    if (!selectedPositionId) {
      setError('Selecciona una posicion de trabajo');
      return;
    }
    if (pdfFiles.length === 0) {
      setError('Selecciona al menos un CV en PDF');
      return;
    }
    if (pdfFiles.length > 50) {
      setError('Maximo 50 archivos PDF permitidos');
      return;
    }
    if (usage && pdfFiles.length > usage.remaining) {
      const resetDate = new Date(usage.billingPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      setError(
        `Solo puedes procesar ${usage.remaining} CVs mas este mes (${usage.used}/${usage.limit} usados). Se reinicia el ${resetDate}.` +
        (usage.plan === 'free' ? ' Actualiza a Premium para 2,000 CVs/mes.' : '')
      );
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProgressLog([]);
    setProgressPercentage(0);
    setCurrentStep('');
    setCurrentMessage('');

    const handleProgress = (event: SSEEvent) => {
      const progressEvent = event as ProgressEvent;
      setCurrentStep(progressEvent.step);
      setCurrentMessage(progressEvent.message);
      setProgressLog((prev) => [...prev, { ...progressEvent, timestamp: new Date().toLocaleTimeString() }]);
      updateProgressPercentage(progressEvent);
    };

    const handleComplete = (finalEvent: FinalResult) => {
      if (finalEvent.success && finalEvent.analysis) {
        const transformedAnalysis = transformAnalysisResponse(finalEvent.analysis);
        setAnalysisResult(transformedAnalysis);
        setCurrentMessage('Analisis completado');
        setProgressPercentage(100);
      } else {
        const limitData = finalEvent as any;
        if (limitData.limit && limitData.used !== undefined) {
          const resetDate = new Date(limitData.billingPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          setError(
            `Limite mensual alcanzado (${limitData.used}/${limitData.limit} CVs). Se reinicia el ${resetDate}.` +
            (limitData.plan === 'free' ? ' Actualiza a Premium para 2,000 CVs/mes.' : '')
          );
        } else {
          setError(finalEvent.error || 'Error desconocido en el analisis');
        }
      }
      setLoading(false);
      loadUsage();
    };

    const handleError = (err: Error) => {
      const limitData = (err as any).limitData;
      if (limitData) {
        const resetDate = new Date(limitData.billingPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        setError(
          `Limite mensual alcanzado (${limitData.used}/${limitData.limit} CVs). Se reinicia el ${resetDate}.` +
          (limitData.plan === 'free' ? ' Actualiza a Premium para 2,000 CVs/mes.' : '')
        );
      } else {
        setError(err.message || 'Error al analizar los CVs.');
      }
      setLoading(false);
      loadUsage();
    };

    await analyzeCVWithProgress(selectedPositionId, pdfFiles, handleProgress, handleComplete, handleError);
  };

  const reset = () => {
    setAnalysisResult(null);
    setPdfFiles([]);
    setError(null);
    setFilterCategory('todos');
    setExpandedCandidate(null);
    setProgressLog([]);
    setProgressPercentage(0);
    setCurrentStep('');
    setCurrentMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStepIcon = (step: string): string => {
    const icons: Record<string, string> = {
      start: '🚀', upload: '📤', excel: '📊', pdfs: '📄',
      prompt: '✍️', claude: '🤖', cleanup: '🧹', complete: '✅',
      error: '❌', warning: '⚠️',
    };
    return icons[step] || '📍';
  };

  const getCandidatesByCategory = (category: CandidateCategory): CandidateScore[] => {
    return analysisResult?.candidatos.filter((c) => c.categoria === category) || [];
  };

  const getFilteredCandidates = (): CandidateScore[] => {
    if (filterCategory === 'todos') return analysisResult?.candidatos || [];
    return getCandidatesByCategory(filterCategory as CandidateCategory);
  };

  const getCategoryClass = (category: string): string => {
    switch (category) {
      case 'entrevistar': return 'bg-green-100 text-green-800';
      case 'quizas': return 'bg-yellow-100 text-yellow-800';
      case 'descartar': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'entrevistar': return 'Entrevistar';
      case 'quizas': return 'Quizas';
      case 'descartar': return 'Descartar';
      default: return category;
    }
  };

  const selectedPosition = positions.find((p) => p.id === selectedPositionId);
  const parsedPosition = selectedPosition ? parseJobPosition(selectedPosition) : null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analisis de CVs</h1>
        {usage && (
          <p className="text-sm text-gray-400 mt-1">
            {usage.remaining} CVs restantes este mes · Plan {usage.plan}
          </p>
        )}
      </div>

      {/* Form */}
      {!analysisResult && !loading && (
        <div className="max-w-4xl space-y-6">
          {/* Step 1: Position */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <h2 className="text-lg font-semibold text-gray-900">Selecciona la posicion</h2>
            </div>

            {loadingPositions ? (
              <div className="animate-pulse space-y-2">
                <div className="bg-gray-200 rounded-lg h-10 w-full" />
              </div>
            ) : positions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  No hay posiciones de trabajo. Crea una para comenzar.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPositionModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Crear Posicion
                </button>
              </div>
            ) : (
              <div>
                <select
                  value={selectedPositionId || ''}
                  onChange={(e) => setSelectedPositionId(Number(e.target.value) || null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  aria-label="Seleccionar posicion de trabajo"
                >
                  <option value="">Selecciona una posicion...</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title} {position.department ? `· ${position.department}` : ''}
                    </option>
                  ))}
                </select>

                {parsedPosition && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parsedPosition.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                        {skill}
                      </span>
                    ))}
                    {parsedPosition.desirableSkills.length > 0 && parsedPosition.desirableSkills.map((skill, idx) => (
                      <span key={`d-${idx}`} className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                selectedPositionId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>2</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Sube los CVs</h2>
              </div>
              {pdfFiles.length > 0 && (
                <span className="text-sm text-gray-400">{pdfFiles.length}/50</span>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : pdfFiles.length > 0
                    ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={onPdfFilesSelected}
                className="hidden"
                aria-label="Seleccionar archivos PDF"
              />

              {pdfFiles.length === 0 ? (
                <div>
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Arrastra archivos PDF aqui o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-400">Maximo 50 archivos PDF</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">
                    {pdfFiles.length} CV{pdfFiles.length > 1 ? 's' : ''} seleccionado{pdfFiles.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Haz clic para agregar mas</p>
                </div>
              )}
            </div>

            {/* File list */}
            {pdfFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">{pdfFiles.length} archivo{pdfFiles.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Quitar todos
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {pdfFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="ml-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Quitar ${file.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Usage bar */}
          {usage && (
            <div className={`rounded-xl p-4 border ${usage.remaining === 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uso mensual</span>
                <span className="text-sm text-gray-500">{usage.used} / {usage.limit} CVs</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.remaining === 0 ? 'bg-red-500' : (usage.used / usage.limit) >= 0.7 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400 capitalize">Plan {usage.plan}</span>
                <span className="text-xs text-gray-400">{usage.remaining} restantes</span>
              </div>
            </div>
          )}

          {/* Info accordion */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span>Como funciona el analisis</span>
            <svg className={`w-4 h-4 transition-transform ${showInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 -mt-3 text-sm text-gray-600 space-y-2">
              <p>- Claude AI extrae automaticamente nombre, email y telefono de cada PDF</p>
              <p>- Cada candidato recibe un score de 0 a 100 basado en los requisitos de la posicion</p>
              <p>- El analisis toma 1-3 minutos dependiendo del numero de CVs</p>
              <p>- CVs duplicados se detectan automaticamente (cache)</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={analyzeResumes}
            disabled={!canAnalyze}
            className={`w-full sm:w-auto px-10 py-3.5 rounded-xl font-semibold text-sm transition-all ${
              !canAnalyze
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.98]'
            }`}
          >
            Analizar {pdfFiles.length > 0 ? `${pdfFiles.length} CV${pdfFiles.length > 1 ? 's' : ''}` : 'Candidatos'}
          </button>
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{getStepIcon(currentStep)}</span>
              <h3 className="text-lg font-semibold text-gray-900">{currentMessage}</h3>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-gray-400">
                {pdfFiles.length} CV{pdfFiles.length > 1 ? 's' : ''} en proceso
              </span>
              <span className="text-sm font-semibold text-blue-600">{progressPercentage}%</span>
            </div>

            {progressLog.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Detalle</h4>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-2">
                  {progressLog.map((log, idx) => (
                    <div key={idx} className={`flex items-start gap-3 text-sm ${log.error ? 'text-red-600' : log.warning ? 'text-yellow-600' : ''}`}>
                      <span className="text-base mt-0.5">{getStepIcon(log.step)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800">{log.message}</p>
                        {log.info && <p className="text-xs text-gray-400 mt-0.5">{log.info}</p>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{log.timestamp || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {analysisResult && !loading && (
        <div className="space-y-6">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Nuevo analisis
          </button>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-5 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{analysisResult.resumen.totalAnalizados}</div>
                <div className="text-sm text-gray-500 font-medium">Total</div>
              </div>
              <div className="bg-green-50 p-5 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{analysisResult.resumen.paraEntrevistar}</div>
                <div className="text-sm text-gray-500 font-medium">Entrevistar</div>
              </div>
              <div className="bg-amber-50 p-5 rounded-xl text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">{analysisResult.resumen.quizas}</div>
                <div className="text-sm text-gray-500 font-medium">Quizas</div>
              </div>
              <div className="bg-red-50 p-5 rounded-xl text-center">
                <div className="text-3xl font-bold text-red-500 mb-1">{analysisResult.resumen.descartados}</div>
                <div className="text-sm text-gray-500 font-medium">Descartados</div>
              </div>
            </div>

            {/* Top 3 */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Top 3 Recomendados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {analysisResult.resumen.top3.map((top, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0 w-9 h-9 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{top.nombre}</div>
                      <div className="text-sm font-semibold text-blue-600 mb-1">{top.score}/100</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{top.fortalezaPrincipal}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos' as FilterCategory, label: `Todos (${analysisResult.candidatos.length})`, active: 'bg-gray-900 text-white' },
                { key: 'entrevistar' as FilterCategory, label: `Entrevistar (${getCandidatesByCategory('entrevistar').length})`, active: 'bg-green-600 text-white' },
                { key: 'quizas' as FilterCategory, label: `Quizas (${getCandidatesByCategory('quizas').length})`, active: 'bg-amber-500 text-white' },
                { key: 'descartar' as FilterCategory, label: `Descartar (${getCandidatesByCategory('descartar').length})`, active: 'bg-red-500 text-white' },
              ].map(({ key, label, active }) => (
                <button
                  key={key}
                  onClick={() => { setFilterCategory(key); setExpandedCandidate(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === key ? active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Candidates */}
          <div className="space-y-4">
            {getFilteredCandidates().map((candidato, idx) => {
              const isExpanded = expandedCandidate === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
                  onClick={() => setExpandedCandidate(isExpanded ? null : idx)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{candidato.nombre}</h3>
                        {isExpanded && (
                          <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                            <div>{candidato.email}</div>
                            {candidato.telefono && <div>{candidato.telefono}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getCategoryClass(candidato.categoria)}`}>
                        {getCategoryLabel(candidato.categoria)}
                      </span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-gray-900">{candidato.score}</span>
                        <span className="text-sm text-gray-400 ml-0.5">/100</span>
                      </div>
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-green-50/50 rounded-lg p-3">
                        <h4 className="font-semibold text-xs text-gray-500 mb-1">Fortaleza Principal</h4>
                        <p className="text-sm text-gray-800 line-clamp-2">{candidato.fortalezaPrincipal}</p>
                      </div>
                      <div className="bg-red-50/50 rounded-lg p-3">
                        <h4 className="font-semibold text-xs text-gray-500 mb-1">Bandera Roja</h4>
                        <p className="text-sm text-gray-800 line-clamp-2">{candidato.banderaRoja}</p>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-100">
                      <div className="bg-green-50/50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Fortaleza Principal</h4>
                        <p className="text-sm text-gray-800 leading-relaxed">{candidato.fortalezaPrincipal}</p>
                      </div>
                      <div className="bg-red-50/50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Bandera Roja</h4>
                        <p className="text-sm text-gray-800 leading-relaxed">{candidato.banderaRoja}</p>
                      </div>
                      {candidato.fortalezas && candidato.fortalezas.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Fortalezas</h4>
                          <ul className="space-y-1.5">
                            {candidato.fortalezas.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-400 mt-1">-</span>{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {candidato.areasAtencion && candidato.areasAtencion.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Areas de Atencion</h4>
                          <ul className="space-y-1.5">
                            {candidato.areasAtencion.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-amber-400 mt-1">-</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {candidato.consistencia && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Consistencia</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{candidato.consistencia}</p>
                        </div>
                      )}
                      {candidato.preguntaSugerida && (
                        <div className="md:col-span-2 bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
                          <h4 className="font-semibold text-sm text-blue-800 mb-2">Pregunta Sugerida</h4>
                          <p className="text-sm text-blue-700 italic leading-relaxed">"{candidato.preguntaSugerida}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {getFilteredCandidates().length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-sm">No hay candidatos en esta categoria</p>
            </div>
          )}
        </div>
      )}

      {showPositionModal && (
        <JobPositionModal
          onClose={() => setShowPositionModal(false)}
          onSave={() => {
            setShowPositionModal(false);
            loadJobPositions();
          }}
        />
      )}
    </div>
  );
};
