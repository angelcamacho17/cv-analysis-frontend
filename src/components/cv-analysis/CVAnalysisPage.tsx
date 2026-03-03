/**
 * CV Analysis Page Component (v4.0.0 - PDF-only)
 * Handles PDF resume upload, real-time progress tracking via SSE,
 * and displays results with category filters
 * BREAKING CHANGE: Excel files are NO LONGER required or supported
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyzeCVWithProgress } from '../../services/cv-analysis.service';
import { getJobPositions } from '../../services/job-positions.service';
import { parseJobPosition } from '../../types/job-positions';
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

  // Job Position Selection (NEW - REQUIRED)
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(true);

  // Form data (v4.0.0 - PDF-only)
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('todos');

  // Progress tracking
  const [currentStep, setCurrentStep] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([]);

  // Load job positions on mount
  useEffect(() => {
    loadJobPositions();
  }, []);

  // Auto-select position from navigation state
  useEffect(() => {
    if (location.state?.selectedPositionId) {
      setSelectedPositionId(location.state.selectedPositionId);
    }
  }, [location.state]);

  const loadJobPositions = async () => {
    try {
      setLoadingPositions(true);
      setError(null); // Clear previous errors
      const data = await getJobPositions({ active: true });
      setPositions(data);

      // Auto-select if only one position exists
      if (data.length === 1) {
        setSelectedPositionId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading positions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar posiciones de trabajo';
      setError(errorMessage);
    } finally {
      setLoadingPositions(false);
    }
  };

  const canAnalyze = pdfFiles.length > 0 && !!selectedPositionId;

  const onPdfFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate PDF files
    const invalidFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
    if (invalidFiles.length > 0) {
      setError('Solo se permiten archivos PDF');
      return;
    }

    if (files.length > 50) {
      setError('Máximo 50 archivos PDF permitidos');
      return;
    }

    setPdfFiles(files);
    setError(null);
  };

  const updateProgressPercentage = (event: ProgressEvent) => {
    // If the event includes progress directly, use it
    if (event.progress !== undefined) {
      setProgressPercentage(event.progress);
      return;
    }

    // Calculate progress based on the step
    const stepProgress: Record<string, number> = {
      start: 5,
      upload: 10,
      excel: 20,
      pdfs: 50,
      prompt: 60,
      claude: 90,
      cleanup: 95,
      complete: 100,
    };

    const progress = stepProgress[event.step] || progressPercentage;
    setProgressPercentage(progress);
  };

  const analyzeResumes = async () => {
    if (!selectedPositionId) {
      setError('Por favor selecciona una posición de trabajo');
      return;
    }

    if (pdfFiles.length === 0) {
      setError('Por favor selecciona al menos un CV en PDF');
      return;
    }

    if (pdfFiles.length > 50) {
      setError('Máximo 50 archivos PDF permitidos');
      return;
    }

    // Reset state
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProgressLog([]);
    setProgressPercentage(0);
    setCurrentStep('');
    setCurrentMessage('');

    console.log('🚀 Iniciando análisis con progreso en tiempo real...');
    console.log(`📍 Posición seleccionada ID: ${selectedPositionId}`);
    console.log(`📄 PDFs a analizar: ${pdfFiles.length}`);

    const handleProgress = (event: SSEEvent) => {
      const progressEvent = event as ProgressEvent;
      setCurrentStep(progressEvent.step);
      setCurrentMessage(progressEvent.message);

      // Add to log
      setProgressLog((prev) => [...prev, progressEvent]);

      // Update percentage
      updateProgressPercentage(progressEvent);

      console.log(`${getStepIcon(progressEvent.step)} ${progressEvent.message}`);
    };

    const handleComplete = (finalEvent: FinalResult) => {
      console.log('🔍 DEBUG - Final Event received:', JSON.stringify(finalEvent, null, 2));

      if (finalEvent.success && finalEvent.analysis) {
        // Transform v4.0.0 English response to Spanish frontend format
        const transformedAnalysis = transformAnalysisResponse(finalEvent.analysis);

        console.log('🔄 Transformed analysis:', transformedAnalysis);

        setAnalysisResult(transformedAnalysis);
        setCurrentMessage('¡Análisis completado exitosamente!');
        setProgressPercentage(100);

        console.log('✅ Análisis completado');
        console.log(`📊 Total analizados: ${transformedAnalysis.resumen.totalAnalizados}`);
        console.log(`✅ Para entrevistar: ${transformedAnalysis.resumen.paraEntrevistar}`);
        console.log(`🤔 Quizás: ${transformedAnalysis.resumen.quizas}`);
        console.log(`❌ Descartados: ${transformedAnalysis.resumen.descartados}`);
      } else {
        console.error('❌ Analysis failed:', finalEvent.error);
        setError(finalEvent.error || 'Error desconocido en el análisis');
        setCurrentMessage(`Error: ${finalEvent.error}`);
      }

      setLoading(false);
    };

    const handleError = (err: Error) => {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al analizar los CVs. Verifica la conexión con el servidor.');
      setCurrentMessage('Error de conexión');
      setLoading(false);
    };

    await analyzeCVWithProgress(
      selectedPositionId,
      pdfFiles,
      handleProgress,
      handleComplete,
      handleError
    );
  };

  const reset = () => {
    setAnalysisResult(null);
    setPdfFiles([]);
    setError(null);
    setFilterCategory('todos');
    setProgressLog([]);
    setProgressPercentage(0);
    setCurrentStep('');
    setCurrentMessage('');
  };

  const getStepIcon = (step: string): string => {
    const icons: Record<string, string> = {
      start: '🚀',
      upload: '📤',
      excel: '📊',
      pdfs: '📄',
      prompt: '✍️',
      claude: '🤖',
      cleanup: '🧹',
      complete: '✅',
      error: '❌',
      warning: '⚠️',
    };
    return icons[step] || '📍';
  };

  const getCandidatesByCategory = (category: CandidateCategory): CandidateScore[] => {
    return analysisResult?.candidatos.filter((c) => c.categoria === category) || [];
  };

  const getFilteredCandidates = (): CandidateScore[] => {
    if (filterCategory === 'todos') {
      return analysisResult?.candidatos || [];
    }
    return getCandidatesByCategory(filterCategory as CandidateCategory);
  };

  const getCategoryClass = (category: string): string => {
    switch (category) {
      case 'entrevistar':
        return 'bg-green-100 text-green-800';
      case 'quizas':
        return 'bg-yellow-100 text-yellow-800';
      case 'descartar':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'entrevistar':
        return '✅ Entrevistar';
      case 'quizas':
        return '🤔 Quizás';
      case 'descartar':
        return '❌ Descartar';
      default:
        return category;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
        Análisis de CVs con Claude
      </h1>
      <p className="text-gray-600 mb-6 text-sm sm:text-base">
        Analiza candidatos para Victoria Poggioli usando Inteligencia Artificial
      </p>

      {/* Formulario de carga */}
      {!analysisResult && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-4xl">
          <div className="space-y-6">
            {/* JOB POSITION SELECTOR - NEW! REQUIRED! */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición de Trabajo *
              </label>

              {loadingPositions ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Cargando posiciones...</span>
                </div>
              ) : positions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    ⚠️ No hay posiciones de trabajo. Debes crear una posición primero.
                  </p>
                  <a
                    href="/positions"
                    className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    ➕ Crear Posición
                  </a>
                </div>
              ) : (
                <>
                  <select
                    value={selectedPositionId || ''}
                    onChange={(e) => setSelectedPositionId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Selecciona una posición --</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title} ({position.total_analyses || 0} análisis previos)
                      </option>
                    ))}
                  </select>

                  {selectedPositionId && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      {(() => {
                        const selected = positions.find((p) => p.id === selectedPositionId);
                        if (!selected) return null;
                        const parsed = parseJobPosition(selected);

                        return (
                          <div>
                            <h4 className="font-semibold text-sm text-blue-900 mb-2">
                              📋 Analizando para: {selected.title}
                            </h4>
                            <div className="text-xs text-blue-800">
                              <strong>Habilidades Requeridas:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {parsed.requiredSkills.slice(0, 5).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-200 text-blue-900 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {parsed.requiredSkills.length > 5 && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    +{parsed.requiredSkills.length - 5} más
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CVs en PDF - REQUIRED (v4.0.0) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVs en PDF (1-50 archivos) *
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={onPdfFilesSelected}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                required
              />
              {pdfFiles.length > 0 && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ {pdfFiles.length} CV{pdfFiles.length > 1 ? 's' : ''} seleccionado{pdfFiles.length > 1 ? 's' : ''}
                </p>
              )}
              {pdfFiles.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {pdfFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información (v4.0.0 - PDF-only) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-2">
                <strong>ℹ️ Información (v4.0.0):</strong>
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4">
                <li>• Los CVs en PDF son obligatorios (mínimo 1, máximo 50)</li>
                <li>• Ya NO se requiere archivo Excel</li>
                <li>• Claude extrae automáticamente nombre, email y teléfono de cada PDF</li>
                <li>• El análisis puede tomar 1-3 minutos dependiendo del número de CVs</li>
                <li>• El sistema detecta automáticamente CVs duplicados (caché)</li>
              </ul>
            </div>

            {/* Botón de análisis */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-gray-500">* Campos obligatorios</div>
              <button
                onClick={analyzeResumes}
                disabled={loading || !canAnalyze}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  loading || !canAnalyze
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {!loading ? (
                  <span>🚀 Analizar Candidatos</span>
                ) : (
                  <span>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Analizando...
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {/* Progress Section */}
          {loading && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              {/* Current Step */}
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>{getStepIcon(currentStep)}</span>
                <span>{currentMessage}</span>
              </h3>

              {/* Progress Bar */}
              <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 10 && (
                    <span className="text-white text-xs font-bold">{progressPercentage}%</span>
                  )}
                </div>
              </div>
              <p className="text-center text-sm font-medium text-blue-600 mb-4">{progressPercentage}%</p>

              {/* Progress Log */}
              {progressLog.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Detalle del progreso:</h4>
                  <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-2">
                    {progressLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 text-sm border-b border-gray-200 pb-2 last:border-0 ${
                          log.error ? 'text-red-600' : log.warning ? 'text-yellow-600' : ''
                        }`}
                      >
                        <span className="text-lg">{getStepIcon(log.step)}</span>
                        <div className="flex-1">
                          <p className="text-gray-900">{log.message}</p>
                          {log.info && <p className="text-xs text-gray-500 mt-1">{log.info}</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-500 mt-4">
                Este proceso puede tomar 1-2 minutos dependiendo del número de candidatos...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resultados */}
      {analysisResult && !loading && (
        <div className="space-y-6">
          {/* Botón volver */}
          <button
            onClick={reset}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            ← Analizar nuevos candidatos
          </button>

          {/* Resumen ejecutivo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Resumen Ejecutivo</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {analysisResult.resumen.totalAnalizados}
                </div>
                <div className="text-sm text-gray-600">Total analizados</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {analysisResult.resumen.paraEntrevistar}
                </div>
                <div className="text-sm text-gray-600">Para entrevistar</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{analysisResult.resumen.quizas}</div>
                <div className="text-sm text-gray-600">Quizás</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{analysisResult.resumen.descartados}</div>
                <div className="text-sm text-gray-600">Descartados</div>
              </div>
            </div>

            {/* TOP 3 */}
            <div className="border-t pt-4">
              <h3 className="font-bold text-lg mb-3">🏆 Top 3 Recomendados</h3>
              <div className="space-y-2">
                {analysisResult.resumen.top3.map((top, i) => (
                  <div key={i} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{top.nombre}</div>
                      <div className="text-sm text-gray-600">Score: {top.score}/100</div>
                      <div className="text-sm text-gray-700 mt-1">{top.fortalezaPrincipal}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === 'todos'
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos ({analysisResult.candidatos.length})
              </button>
              <button
                onClick={() => setFilterCategory('entrevistar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === 'entrevistar'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✅ Entrevistar ({getCandidatesByCategory('entrevistar').length})
              </button>
              <button
                onClick={() => setFilterCategory('quizas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === 'quizas'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🤔 Quizás ({getCandidatesByCategory('quizas').length})
              </button>
              <button
                onClick={() => setFilterCategory('descartar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === 'descartar'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ❌ Descartar ({getCandidatesByCategory('descartar').length})
              </button>
            </div>
          </div>

          {/* Lista de candidatos */}
          <div className="space-y-4">
            {getFilteredCandidates().map((candidato, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{candidato.nombre}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>📧 {candidato.email}</div>
                      <div>📱 {candidato.telefono}</div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-bold text-center ${getCategoryClass(candidato.categoria)}`}>
                      {getCategoryLabel(candidato.categoria)}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {candidato.score}
                      <span className="text-lg text-gray-500">/100</span>
                    </div>
                  </div>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">💪 Fortaleza Principal</h4>
                    <p className="text-sm text-gray-900">{candidato.fortalezaPrincipal}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">🚩 Bandera Roja</h4>
                    <p className="text-sm text-gray-900">{candidato.banderaRoja}</p>
                  </div>

                  {candidato.fortalezas && candidato.fortalezas.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">✨ Fortalezas</h4>
                      <ul className="list-disc list-inside text-sm text-gray-900 space-y-1">
                        {candidato.fortalezas.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidato.areasAtencion && candidato.areasAtencion.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">⚠️ Áreas de Atención</h4>
                      <ul className="list-disc list-inside text-sm text-gray-900 space-y-1">
                        {candidato.areasAtencion.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidato.consistencia && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">📋 Consistencia CV vs Formulario</h4>
                      <p className="text-sm text-gray-900">{candidato.consistencia}</p>
                    </div>
                  )}

                  {candidato.preguntaSugerida && (
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-900 mb-2">
                        💬 Pregunta Sugerida para Entrevista
                      </h4>
                      <p className="text-sm text-blue-900 italic">&quot;{candidato.preguntaSugerida}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No hay candidatos en la categoría seleccionada */}
          {getFilteredCandidates().length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">No hay candidatos en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
