// Test script to check Edge Function directly
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjyziszwmrwycodfkjac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeXppc3p3bXJ3eWNvZGZramFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzUzNDgsImV4cCI6MjA3MzgxMTM0OH0.XCJCMfbOWZLQjdGLZhCJBgzlJMHqkJhJWGqZEqNJOWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEdgeFunction() {
  try {
    console.log('🧪 Testing Edge Function...')
    
    // Use a simple test image URL
    const testImageUrl = 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=Test+Image'
    
    const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
      body: { screenshotUrl: testImageUrl }
    })
    
    if (error) {
      console.error('❌ Edge Function failed:')
      console.error('Status:', error.status)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      return
    }
    
    console.log('✅ Edge Function succeeded:')
    console.log('Data:', data)
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testEdgeFunction()
