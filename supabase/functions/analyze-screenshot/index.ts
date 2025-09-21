// Edge Function: analyze-screenshot
// Analyzes screenshot images using OpenAI GPT-5 Vision API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
  id: string;
  object: string;
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
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

  const modelName = 'gpt-5-chat-latest'
  console.log(`🤖 Using OpenAI model: ${modelName}`)
  console.log(`📸 Analyzing image: ${imageUrl}`)

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: `You are a phishing scam and cyber security specialist. You protect clients from scams that start with text messages, emails, or similar communications. Your clients are typically not tech savvy and are ages 30+. They send you screenshots of messages they feel unsure about.

For every screenshot you receive, you must:
Analyze the sender (Reply-To in emails, phone number/shortcode in texts).
Analyze the message contents.
Decide if it is safe for the user to interact, or if they should avoid it.

Rules:
Always keep your explanation short, strict, and easy to read (as if for a 50-year-old non-technical parent).
Use this exact structure with clean formatting:

Sender Check
[Your analysis of the sender information. Be sure to check the sender information (what comes after 'Reply To' for emails, NOT the 'To'. The 'To' is usually our user's email address)]

Message Check  
[Your analysis of the message content]

Action
[Clear instruction for the user]

Formatting guidelines:
- Use "Sender Check", "Message Check", and "Action" as section headers (no asterisks or special characters)
- Keep each section to 1-2 sentences maximum
- If safe: explain briefly why
- If unsafe or unsure: always say "Do not click, do not reply, block it."
- Never tell the client to click links, call numbers, or reply directly to suspicious messages
- Instead, direct them to the official app or website of the company
- Be cautious. If there is any uncertainty, always default to telling the user not to interact.`
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Here is a screenshot of a text or email I received. Tell me if it is safe to interact with and what I should do.`
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
        model: modelName,
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
    
    // Log the complete OpenAI response for debugging
    console.log('🔍 Complete OpenAI Response:')
    console.log('📊 Usage Stats:', JSON.stringify(data.usage, null, 2))
    console.log('🤖 Model Used:', data.model)
    console.log('🆔 Response ID:', data.id)
    console.log('📝 Choices Count:', data.choices?.length || 0)
    
    if (data.choices && data.choices.length > 0) {
      console.log('🎯 First Choice Details:')
      console.log('  - Finish Reason:', data.choices[0].finish_reason)
      console.log('  - Message Role:', data.choices[0].message.role)
      console.log('  - Content Length:', data.choices[0].message.content?.length || 0)
    }
    
    // Log the complete raw response for easy copying
    const rawResponse = JSON.stringify(data, null, 2)
    console.log('📋 Raw OpenAI Response (first 1000 chars):', rawResponse.substring(0, 1000))
    
    // Output complete payload with clear markers for easy copying
    console.log('🔥 COMPLETE_GPT5_PAYLOAD_START 🔥')
    console.log(rawResponse)
    console.log('🔥 COMPLETE_GPT5_PAYLOAD_END 🔥')
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API')
    }

    const analysis = data.choices[0].message.content
    console.log(`✅ OpenAI analysis completed successfully using ${modelName}`)
    
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
          status: 'completed',
          // Add debug info (you can remove this in production)
          debug: {
            model_used: 'gpt-5-chat-latest',
            timestamp: new Date().toISOString()
          }
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
