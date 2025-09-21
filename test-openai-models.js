// Test script to check available OpenAI models
import fetch from 'node-fetch'

const openaiApiKey = process.env.OPENAI_API_KEY || 'your-openai-api-key-here'

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking available OpenAI models...')
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      console.error('❌ Failed to fetch models:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    
    // Filter for GPT models that support vision
    const gptModels = data.data.filter(model => 
      model.id.includes('gpt') && 
      (model.id.includes('vision') || model.id.includes('4o') || model.id.includes('5'))
    )
    
    console.log('🤖 Available GPT models with vision capabilities:')
    gptModels.forEach(model => {
      console.log(`  - ${model.id}`)
    })
    
    // Check if GPT-5 exists
    const gpt5Models = gptModels.filter(model => model.id.includes('5'))
    if (gpt5Models.length > 0) {
      console.log('🎉 GPT-5 models found:', gpt5Models.map(m => m.id))
    } else {
      console.log('❌ No GPT-5 models found')
    }
    
    // Check for latest GPT-4 models
    const gpt4Models = gptModels.filter(model => model.id.includes('4'))
    console.log('🔥 GPT-4 models available:', gpt4Models.map(m => m.id))
    
  } catch (error) {
    console.error('❌ Error checking models:', error)
  }
}

checkAvailableModels()
