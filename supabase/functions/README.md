# ScamChecker Edge Functions

This directory contains Supabase Edge Functions for the ScamChecker app.

## Functions

### analyze-screenshot
- **Purpose**: Analyzes screenshot images for potential scams using OpenAI Vision API
- **Endpoint**: `POST /functions/v1/analyze-screenshot`
- **Input**: `{ screenshotUrl: string }` (publicly accessible image URL)
- **Output**: `{ analysisId: string, result: string, status: string }`
- **Features**:
  - GPT-4 Vision analysis for scam detection
  - Detailed fraud pattern recognition
  - Comprehensive security assessment
  - Error handling and validation

## Development

### Local Development
1. Install Supabase CLI: `npm install -g supabase`
2. Start local Supabase: `supabase start`
3. Serve functions: `supabase functions serve`
4. Test function: `supabase functions invoke analyze-screenshot --data '{"screenshotUrl":"test.jpg"}'`

### Deployment
1. Deploy to Supabase: `supabase functions deploy analyze-screenshot`
2. Set environment variables in Supabase dashboard

## Environment Variables
- `OPENAI_API_KEY`: OpenAI API key for Vision API calls
- `SUPABASE_SERVICE_ROLE_KEY`: For database operations

## File Structure
```
supabase/functions/
├── _shared/
│   └── cors.ts          # Shared CORS headers
├── analyze-screenshot/
│   ├── index.ts         # Main function code
│   └── test.ts          # Test utilities
└── README.md            # This file
```
