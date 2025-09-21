#!/usr/bin/env node

// Simple script to test and view GPT-5 payload
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjyziszwmrwycodfkjac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeXppc3p3bXJ3eWNvZGZramFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzUzNDgsImV4cCI6MjA3MzgxMTM0OH0.XCJCMfbOWZLQjdGLZhCJBgzlJMHqkJhJWGqZEqNJOWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAndViewPayload() {
  try {
    console.log('🧪 Testing Edge Function and capturing GPT-5 payload...')
    
    // Use a test image
    const testImageUrl = 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=URGENT%21+Click+here+to+claim+your+prize%21'
    
    const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
      body: { screenshotUrl: testImageUrl }
    })
    
    if (error) {
      console.error('❌ Edge Function failed:', error)
      console.log('\n📋 Check Supabase Edge Function logs for the complete GPT-5 payload!')
      console.log('Look for logs between:')
      console.log('🔥 COMPLETE_GPT5_PAYLOAD_START 🔥')
      console.log('🔥 COMPLETE_GPT5_PAYLOAD_END 🔥')
      return
    }
    
    console.log('✅ Edge Function succeeded!')
    console.log('\n📊 Response received:')
    console.log(JSON.stringify(data, null, 2))
    
    console.log('\n📋 To see the complete GPT-5 payload:')
    console.log('1. Go to Supabase Dashboard → Edge Functions → analyze-screenshot → Logs')
    console.log('2. Look for logs with "COMPLETE_GPT5_PAYLOAD_START"')
    console.log('3. Copy everything between START and END markers')
    console.log('4. That\'s the complete OpenAI response!')
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testAndViewPayload()
