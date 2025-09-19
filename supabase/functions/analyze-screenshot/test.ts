// Test file for analyze-screenshot Edge Function
// This can be used to test the function locally

const testAnalyzeScreenshot = async () => {
  const testPayload = {
    screenshotUrl: "https://example.com/test-screenshot.jpg"
  }

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
    console.log('Test Result:', result)
    
    if (response.ok) {
      console.log('✅ Edge Function test passed!')
    } else {
      console.log('❌ Edge Function test failed:', result)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Uncomment to run test
// testAnalyzeScreenshot()
