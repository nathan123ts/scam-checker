// Edge Function: analyze-screenshot
// Analyzes screenshot images using OpenAI Vision API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("analyze-screenshot Edge Function loaded")

interface OpenAIMessage {
  role: string;
  content: Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Database helper functions
async function createAnalysisRecord(screenshotUrl: string): Promise<string> {
  const { data, error } = await supabase
    .from('analysis_requests')
    .insert({
      screenshot_url: screenshotUrl,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating analysis record:', error)
    throw new Error(`Failed to create analysis record: ${error.message}`)
  }

  return data.id
}

async function updateAnalysisRecord(analysisId: string, result: string, durationMs: number): Promise<void> {
  const { error } = await supabase
    .from('analysis_requests')
    .update({
      openai_result: result,
      completed_at: new Date().toISOString(),
      analysis_duration_ms: durationMs
    })
    .eq('id', analysisId)

  if (error) {
    console.error('Error updating analysis record:', error)
    throw new Error(`Failed to update analysis record: ${error.message}`)
  }
}

async function analyzeImageWithOpenAI(imageUrl: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const messages: OpenAIMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze this screenshot for potential scams, phishing attempts, or fraudulent content. 

Please examine:
1. URLs and domain names for suspicious patterns
2. Grammar, spelling, and language inconsistencies
3. Urgency tactics or pressure techniques
4. Requests for personal information, passwords, or financial details
5. Suspicious sender information or contact methods
6. Visual design inconsistencies with legitimate brands
7. Any other red flags that indicate fraudulent activity

Provide a detailed analysis explaining whether this appears to be a scam and why. Be specific about what elements make it suspicious or legitimate.`
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        }
      ]
    }
  ]

  try {
    console.log(`Calling OpenAI Vision API for image: ${imageUrl}`)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent analysis
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data: OpenAIResponse = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API')
    }

    const analysis = data.choices[0].message.content
    console.log('OpenAI analysis completed successfully')
    
    return analysis

  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    throw new Error(`Failed to analyze image: ${error.message}`)
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { screenshotUrl } = await req.json()

    if (!screenshotUrl) {
      return new Response(
        JSON.stringify({ error: 'screenshotUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let analysisId: string | null = null
    
    try {
      // 1. Create analysis record in database
      analysisId = await createAnalysisRecord(screenshotUrl)
      console.log(`Created analysis record ${analysisId} for URL: ${screenshotUrl}`)

      // 2. Call OpenAI Vision API to analyze the screenshot
      const startTime = Date.now()
      const analysisResult = await analyzeImageWithOpenAI(screenshotUrl)
      const duration = Date.now() - startTime
      
      // 3. Update analysis record with results
      await updateAnalysisRecord(analysisId, analysisResult, duration)
      
      console.log(`Analysis ${analysisId} completed successfully in ${duration}ms`)

      return new Response(
        JSON.stringify({
          analysisId,
          result: analysisResult,
          status: 'completed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )

    } catch (analysisError) {
      console.error(`Analysis ${analysisId || 'unknown'} failed:`, analysisError)
      
      return new Response(
        JSON.stringify({
          analysisId: analysisId || null,
          error: 'Analysis failed',
          message: analysisError.message,
          status: 'failed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

  } catch (error) {
    console.error('Error in analyze-screenshot function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
