// Analysis-related TypeScript types

/**
 * Analysis state interface for Redux store
 */
export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  analysisId: string | null;
}

/**
 * Analysis request payload for API calls
 */
export interface AnalysisRequest {
  screenshotUrl: string;
}

/**
 * Analysis response from Edge Function
 */
export interface AnalysisResponse {
  analysisId: string;
  result: string;
}

/**
 * Error response structure
 */
export interface AnalysisError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Screenshot upload response
 */
export interface ScreenshotUploadResponse {
  url: string;
  signedUrl: string;
  path: string;
}

/**
 * App Group file information
 */
export interface SharedScreenshot {
  filename: string;
  path: string;
  timestamp: number;
  exists: boolean;
}

/**
 * Analysis status enum
 */
export enum AnalysisStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}
