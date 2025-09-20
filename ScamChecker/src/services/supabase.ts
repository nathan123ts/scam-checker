import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Get Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || ''
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || ''

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required. Please check your environment configuration.')
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is required. Please check your environment configuration.')
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Since this is an MVP without user authentication,
    // we'll use anonymous access for now
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to test Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple test query to verify connection
    const { error } = await supabase
      .from('analysis_requests')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

// Export configuration for debugging
export const supabaseConfig = {
  url: supabaseUrl,
  // Don't log the full key for security, just show if it exists
  hasAnonKey: !!supabaseAnonKey,
}
