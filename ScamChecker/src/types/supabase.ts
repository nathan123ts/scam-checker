// Supabase-related TypeScript types

/**
 * Database schema types based on the analysis_requests table
 */
export interface AnalysisRequestRecord {
  id: string; // UUID
  screenshot_url: string;
  openai_result: any | null; // JSONB
  created_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  analysis_duration_ms: number | null;
  expires_at: string; // Generated column (created_at + 72 hours)
}

/**
 * Insert type for analysis_requests (omits generated fields)
 */
export interface AnalysisRequestInsert {
  screenshot_url: string;
  openai_result?: any;
  completed_at?: string;
  analysis_duration_ms?: number;
}

/**
 * Update type for analysis_requests
 */
export interface AnalysisRequestUpdate {
  openai_result?: any;
  completed_at?: string;
  analysis_duration_ms?: number;
}

/**
 * Supabase storage bucket configuration
 */
export interface StorageBucket {
  name: string;
  id: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase file upload options
 */
export interface FileUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * Supabase storage file info
 */
export interface StorageFileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

/**
 * Supabase Edge Function response wrapper
 */
export interface EdgeFunctionResponse<T = any> {
  data: T;
  error: null;
}

/**
 * Supabase Edge Function error response
 */
export interface EdgeFunctionError {
  data: null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  };
}

/**
 * Database table names enum for type safety
 */
export enum DatabaseTable {
  ANALYSIS_REQUESTS = 'analysis_requests'
}

/**
 * Storage bucket names enum for type safety  
 */
export enum StorageBucketName {
  SCREENSHOTS = 'screenshots'
}
