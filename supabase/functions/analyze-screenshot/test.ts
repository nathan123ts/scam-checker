// Test file for analyze-screenshot Edge Function with OpenAI integration
// This can be used to test the function locally or in production

const testAnalyzeScreenshot = async () => {
  // Test with a publicly accessible image URL
  const testPayload = {
    screenshotUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png"
  }

  console.log('🧪 Testing Edge Function with OpenAI Vision API...')
  console.log('Test payload:', testPayload)

  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/analyze-screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_ANON_KEY_HERE`
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()
    console.log('\n📊 Test Result:')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (response.ok && result.analysisId && result.result) {
      console.log('\n✅ Edge Function test passed!')
      console.log('Analysis ID:', result.analysisId)
      console.log('Analysis Result Preview:', result.result.substring(0, 100) + '...')
    } else {
      console.log('\n❌ Edge Function test failed:', result)
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error)
  }
}

const testWithProductionURL = async (productionUrl: string, anonKey: string) => {
  const testPayload = {
    screenshotUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png"
  }

  console.log('🚀 Testing Edge Function in production...')
  console.log('Production URL:', productionUrl)

  try {
    const response = await fetch(`${productionUrl}/functions/v1/analyze-screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()
    console.log('\n📊 Production Test Result:')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('\n❌ Production test error:', error)
  }
}

// Uncomment to run local test
// testAnalyzeScreenshot()

// Uncomment to run production test (replace with your actual values)
// testWithProductionURL('https://your-project.supabase.co', 'your-anon-key')
