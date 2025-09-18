# ScamChecker MVP - Complete Architecture

## Overview
A React Native iOS app that analyzes suspicious message screenshots using GPT Vision API through Supabase Edge Functions. Users share screenshots via iOS Share Sheet, app processes via server-side analysis, and displays formatted results.

---

## File & Folder Structure

```
PhishCheck/
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.tsx           # Reusable loading component
│   │   ├── ErrorMessage.tsx             # Error display component
│   │   └── index.ts                     # Component exports
│   ├── screens/
│   │   ├── AnalyzeScreen.tsx            # Main screen: shows loading/analysis
│   │   └── JsonResultScreen.tsx         # Results display screen
│   ├── services/
│   │   ├── supabase.ts                  # Supabase client configuration
│   │   ├── analysisService.ts           # Analysis API calls
│   │   └── appGroupService.ts           # App Group file operations
│   ├── store/
│   │   ├── analysisSlice.ts             # Analysis state management
│   │   └── store.ts                     # Redux store configuration
│   ├── types/
│   │   ├── analysis.ts                  # Analysis-related types
│   │   └── supabase.ts                  # Database types
│   ├── utils/
│   │   ├── constants.ts                 # App constants
│   │   ├── appGroup.ts                  # App Group utilities
│   │   └── formatting.ts               # JSON formatting utilities
│   ├── navigation/
│   │   └── AppNavigator.tsx             # Navigation setup
│   └── App.tsx                          # Main app component
├── ios/
│   ├── PhishCheck/
│   │   ├── AppDelegate.mm               # Main app delegate
│   │   ├── Info.plist                   # App configuration
│   │   └── PhishCheck.entitlements      # App Group entitlements
│   ├── ShareExtension/                  # Share Extension target
│   │   ├── ShareViewController.swift    # Share handling logic
│   │   ├── Info.plist                   # Extension configuration
│   │   ├── ShareExtension.entitlements  # Extension entitlements
│   │   └── MainInterface.storyboard     # Extension UI (minimal)
│   └── PhishCheck.xcodeproj/
├── supabase/
│   ├── functions/
│   │   └── analyze-screenshot/
│   │       ├── index.ts                 # Edge function main logic
│   │       └── _utils.ts                # Helper functions
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # Database schema
│   └── config.toml                      # Supabase configuration
├── app.config.js                        # Expo configuration
├── package.json
└── README.md
```

---

## Component Architecture & Responsibilities

### **Frontend (React Native)**

#### **Screens**
- **AnalyzeScreen.tsx**
  - Entry point when app opens from share extension
  - Checks App Group container for shared screenshot
  - Shows loading spinner during analysis
  - Handles upload to Supabase Storage
  - Calls analysis Edge Function
  - Navigates to results screen on completion

- **JsonResultScreen.tsx**
  - Displays formatted GPT analysis results
  - Scrollable text view for long responses
  - Basic text formatting for readability

#### **Services**
- **supabase.ts**: Supabase client initialization and configuration
- **analysisService.ts**: 
  - Upload screenshot to Supabase Storage
  - Call `analyze-screenshot` Edge Function
  - Handle API responses and errors
- **appGroupService.ts**: Read/write files from App Group shared container

#### **State Management (Redux Toolkit)**
- **analysisSlice.ts**:
  - `isLoading: boolean` - Analysis in progress
  - `result: string | null` - GPT analysis result
  - `error: string | null` - Error message if analysis fails
  - `analysisId: string | null` - Database record ID

### **iOS Share Extension**
- **ShareViewController.swift**
  - Receives shared image from iOS Share Sheet
  - Validates image type (PNG/JPEG/HEIC)
  - Saves image to App Group container with timestamp filename
  - Opens main app via URL scheme
  - Immediately exits extension

### **Backend (Supabase)**

#### **Storage**
- **Bucket**: `screenshots` (private, service role access)
- **Path structure**: `screenshots/anon/{timestamp}_{uuid}.{ext}`
- **Cleanup**: Scheduled job deletes files older than 72 hours

#### **Edge Function: analyze-screenshot**
```typescript
// Input: { screenshotUrl: string }
// Process: Fetch image → Call GPT Vision → Save to DB
// Output: { analysisId: string, result: string }
```

#### **Database Schema**
```sql
analysis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screenshot_url TEXT NOT NULL,
  openai_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  analysis_duration_ms INTEGER
)
```

---

## Data Flow

### **Share Extension Flow**
1. User shares screenshot → Share Extension receives image
2. Extension saves to App Group: `/group.com.yourapp.phishcheck/screenshot_{timestamp}.png`
3. Extension opens main app: `phishcheck://analyze`
4. Extension exits immediately

### **Main App Analysis Flow**
1. App opens via URL scheme → Navigate to AnalyzeScreen
2. AnalyzeScreen checks App Group container for new screenshot
3. If found:
   - Set `isLoading = true`
   - Upload screenshot to Supabase Storage
   - Get signed URL for uploaded file
   - Call Edge Function with signed URL
   - Edge Function processes and saves to database
   - Return analysis result to app
   - Set `result` and `isLoading = false`
   - Navigate to JsonResultScreen
4. JsonResultScreen displays formatted result

### **State Flow**
```
App Launch → Check App Group → Image Found
    ↓
Upload to Storage → analysisSlice.setLoading(true)
    ↓
Call Edge Function → analysisSlice.setLoading(true)
    ↓
Receive Result → analysisSlice.setResult(data)
    ↓
Navigate to Results → Display formatted JSON
```

---

## Technical Implementation Details

### **App Group Configuration**
- **Group ID**: `group.com.yourapp.phishcheck`
- **Main App**: Read/write access to shared container
- **Share Extension**: Write access to save screenshots

### **URL Scheme**
- **Scheme**: `phishcheck://`
- **Routes**: 
  - `phishcheck://analyze` - Trigger analysis flow

### **Supabase Edge Function**
```typescript
// analyze-screenshot/index.ts
export default async function(req: Request) {
  const { screenshotUrl } = await req.json()
  
  // 1. Create analysis record
  const analysisId = await createAnalysisRecord(screenshotUrl)
  
  // 2. Fetch screenshot
  const imageBuffer = await fetchScreenshot(screenshotUrl)
  
  // 3. Call GPT Vision
  const startTime = Date.now()
  const gptResult = await callGPTVision(imageBuffer)
  const duration = Date.now() - startTime
  
  // 4. Update analysis record
  await updateAnalysisRecord(analysisId, gptResult, duration)
  
  return { analysisId, result: gptResult }
}
```

### **Image Processing**
- **Supported formats**: PNG, JPEG, HEIC
- **Size limits**: iOS Share Extension memory limits (~30MB)
- **Conversion**: HEIC → JPEG server-side if needed

---

## Configuration Files

### **app.config.js**
```javascript
export default {
  name: "PhishCheck",
  slug: "phishcheck",
  platforms: ["ios"],
  ios: {
    bundleIdentifier: "com.yourapp.phishcheck",
    buildNumber: "1.0.0"
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static"
        }
      }
    ]
  ]
}
```

### **iOS Info.plist Changes**
```xml
<!-- URL Scheme for deep linking -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.yourapp.phishcheck</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>phishcheck</string>
    </array>
  </dict>
</array>

<!-- App Group Entitlement -->
<key>com.apple.security.application-groups</key>
<array>
  <string>group.com.yourapp.phishcheck</string>
</array>
```

### **Share Extension Info.plist**
```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.share-services</string>
  <key>NSExtensionActivationRule</key>
  <dict>
    <key>NSExtensionActivationSupportsImageWithMaxCount</key>
    <integer>1</integer>
  </dict>
</dict>
```

---

## Database Schema (Detailed)

```sql
-- Analysis tracking table
CREATE TABLE analysis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screenshot_url TEXT NOT NULL,
  openai_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  analysis_duration_ms INTEGER,
  
  -- Computed column for cleanup
  expires_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at + INTERVAL '72 hours') STORED
);

-- Index for cleanup job
CREATE INDEX idx_analysis_expires_at ON analysis_requests(expires_at);

-- RLS Policy (since no auth, allow all for now)
ALTER TABLE analysis_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON analysis_requests FOR ALL USING (true);
```

---

## Environment Variables

### **Supabase Edge Function**
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### **React Native App**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

---

## Build & Deployment

### **Development Setup**
```bash
# 1. Create Expo project
npx create-expo-app PhishCheck --template bare-minimum

# 2. Install dependencies
npm install @supabase/supabase-js @reduxjs/toolkit react-redux

# 3. Prebuild for iOS
npx expo prebuild --platform ios

# 4. Add Share Extension in Xcode
# 5. Configure App Groups in Apple Developer
# 6. Run on device
npx expo run:ios
```

### **TestFlight Deployment**
```bash
# Build for TestFlight
npx expo build:ios

# Or use EAS Build
eas build --platform ios
eas submit --platform ios
```

---

## Performance Targets

### **Latency Breakdown**
- Share Extension save: ~50ms
- App launch + navigation: ~300ms
- Image upload to Supabase: ~200-500ms (LTE/WiFi)
- Edge Function + GPT Vision: ~800-1200ms
- **Total perceived latency**: ~1.0-1.8s ✅

### **Optimization Strategies**
- Compress images before upload if >2MB
- Use Supabase Storage CDN for fast access
- Minimal Share Extension code (save + exit quickly)
- Parallel upload + Edge Function call if possible

---

## Testing Strategy

### **TestFlight Test Cases**
1. Share screenshot from Messages app
2. Share screenshot from WhatsApp
3. Share screenshot from Mail app
4. Share non-image (should gracefully handle)
5. Share multiple images (should use first one)
6. Test on various iOS versions (iOS 15+)
7. Test on different device sizes (iPhone 12, 14, SE)

### **Edge Cases**
- Very large screenshots (>10MB)
- Corrupted image files
- Network timeouts during analysis
- GPT API errors/rate limits
- App Group permission issues

---

## Future Considerations

### **Easy Additions**
- User authentication (Supabase Auth)
- Analysis history screen
- Push notifications when analysis completes
- Better error handling and retry logic

### **Harder Additions**
- PDF support (requires server-side conversion)
- Multiple image analysis
- Custom GPT prompts/analysis types
- iPad layout support

---

This architecture provides a solid foundation for your PhishCheck MVP while keeping complexity minimal and focusing on the core user flow.
