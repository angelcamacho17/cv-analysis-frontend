/**
 * CV Analysis Service (v4.0.0 - PDF-only)
 * Handles CV analysis API communication with SSE streaming
 * BREAKING CHANGE: Excel files are NO LONGER required or supported
 */

import { apiFetch } from './api-client';
import type { AnalysisResult, SSEEvent, FinalResult } from '../types/cv-analysis';

// v4.0.0: Analysis endpoints are now at /api/analyze and /api/analyze-stream

/**
 * Analyzes CVs with real-time progress updates via Server-Sent Events
 * v4.0.0: PDF-only, no Excel file required
 * @param jobPositionId - Job position ID (REQUIRED)
 * @param cvFiles - Array of PDF CV files (REQUIRED, 1-50 files)
 * @param onProgress - Callback for progress events
 * @param onComplete - Callback for final result
 * @param onError - Callback for errors
 */
export const analyzeCVWithProgress = async (
  jobPositionId: number,
  cvFiles: File[],
  onProgress: (event: SSEEvent) => void,
  onComplete: (result: FinalResult) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('jobPositionId', String(jobPositionId));
    cvFiles.forEach((cv) => formData.append('cvs', cv));

    const response = await apiFetch(`/analyze-stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event: SSEEvent = JSON.parse(data);

            if ('done' in event && event.done) {
              onComplete(event);
            } else {
              onProgress(event);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
};

/**
 * Analyzes CVs without progress tracking (legacy method)
 * v4.0.0: PDF-only, no Excel file required
 * @param jobPositionId - Job position ID (REQUIRED)
 * @param cvFiles - Array of PDF CV files (REQUIRED, 1-50 files)
 * @returns Promise with analysis result
 */
export const analyzeCV = async (
  jobPositionId: number,
  cvFiles: File[]
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('jobPositionId', String(jobPositionId));
  cvFiles.forEach((cv) => formData.append('cvs', cv));

  const response = await apiFetch(`/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Checks the health status of the CV analysis service
 */
export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await apiFetch(`/health`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
