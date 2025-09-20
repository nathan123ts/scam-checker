import { supabase } from './supabase'

// Analysis service types
export interface AnalysisResult {
  analysisId: string
  result: string
  status: 'completed' | 'failed'
}

export interface AnalysisError {
  error: string
  message: string
}

/**
 * Upload screenshot to Supabase Storage
 * @param imageUri - Local file URI from device
 * @param filename - Name for the uploaded file
 * @returns Public URL of uploaded image
 */
export const uploadScreenshot = async (imageUri: string, filename: string): Promise<string> => {
  try {
    console.log(`📤 Uploading screenshot: ${filename}`)
    
    // Convert image URI to blob for upload
    const response = await fetch(imageUri)
    const blob = await response.blob()
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(`anon/${filename}`, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Failed to upload screenshot: ${error.message}`)
    }
    
    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(data.path)
    
    const publicUrl = publicUrlData.publicUrl
    console.log(`✅ Screenshot uploaded successfully: ${publicUrl}`)
    
    return publicUrl
    
  } catch (error) {
    console.error('Error uploading screenshot:', error)
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Call Edge Function to analyze screenshot
 * @param screenshotUrl - Public URL of uploaded screenshot
 * @returns Analysis result from GPT Vision API
 */
export const analyzeScreenshot = async (screenshotUrl: string): Promise<AnalysisResult> => {
  try {
    console.log(`🔍 Starting analysis for: ${screenshotUrl}`)
    
    // Call the analyze-screenshot Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
      body: { screenshotUrl }
    })
    
    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(`Analysis failed: ${error.message}`)
    }
    
    // Validate response structure
    if (!data || !data.analysisId || !data.result) {
      console.error('Invalid response from Edge Function:', data)
      throw new Error('Invalid response from analysis service')
    }
    
    console.log(`✅ Analysis completed: ${data.analysisId}`)
    
    return {
      analysisId: data.analysisId,
      result: data.result,
      status: data.status || 'completed'
    }
    
  } catch (error) {
    console.error('Error analyzing screenshot:', error)
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Complete analysis flow: upload image and analyze
 * @param imageUri - Local file URI from device
 * @returns Analysis result
 */
export const uploadAndAnalyze = async (imageUri: string): Promise<AnalysisResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const filename = `screenshot_${timestamp}.jpg`
    
    console.log(`🚀 Starting complete analysis flow for: ${filename}`)
    
    // Step 1: Upload screenshot
    const screenshotUrl = await uploadScreenshot(imageUri, filename)
    
    // Step 2: Analyze screenshot
    const result = await analyzeScreenshot(screenshotUrl)
    
    console.log(`🎉 Complete analysis flow finished: ${result.analysisId}`)
    
    return result
    
  } catch (error) {
    console.error('Error in complete analysis flow:', error)
    throw error // Re-throw to let caller handle
  }
}

/**
 * Helper function to generate signed URL for private access
 * @param filePath - Path to file in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('screenshots')
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
    
    return data.signedUrl
    
  } catch (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }
}
