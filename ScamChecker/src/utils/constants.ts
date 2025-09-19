// App constants and environment variables
import Constants from 'expo-constants';

/**
 * Environment configuration
 * These values are loaded from .env file via app.config.js
 */
export const ENV = {
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
} as const;

/**
 * App Group configuration for iOS Share Extension
 */
export const APP_GROUP = {
  IDENTIFIER: 'group.com.yourapp.scamchecker',
  SCREENSHOT_FILENAME_PREFIX: 'screenshot_',
} as const;

/**
 * API endpoints and configuration
 */
export const API = {
  EDGE_FUNCTIONS: {
    ANALYZE_SCREENSHOT: '/functions/v1/analyze-screenshot',
  },
  STORAGE: {
    SCREENSHOTS_BUCKET: 'screenshots',
    SCREENSHOTS_PATH: 'screenshots/anon',
  },
} as const;

/**
 * App navigation routes
 */
export const ROUTES = {
  ANALYZE: 'Analyze',
  RESULTS: 'Results',
} as const;

/**
 * Validate environment variables on app startup
 */
export const validateEnvironment = () => {
  const missing = [];
  
  if (!ENV.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!ENV.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment variables validated successfully');
};
