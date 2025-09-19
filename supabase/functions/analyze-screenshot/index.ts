// Edge Function: analyze-screenshot
// Analyzes screenshot images using OpenAI Vision API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    // Generate unique analysis ID
    const analysisId = crypto.randomUUID()
    console.log(`Starting analysis ${analysisId} for URL: ${screenshotUrl}`)

    try {
      // Call OpenAI Vision API to analyze the screenshot
      const analysisResult = await analyzeImageWithOpenAI(screenshotUrl)
      
      console.log(`Analysis ${analysisId} completed successfully`)

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
      console.error(`Analysis ${analysisId} failed:`, analysisError)
      
      return new Response(
        JSON.stringify({
          analysisId,
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
