# ScamChecker MVP - Granular Step-by-Step Build Plan

## Prerequisites Setup (Tasks 1-8)

### Task 1: Initialize Expo Project
**Goal**: Create base Expo project with correct naming
**Start**: Empty directory
**End**: Running Expo app with "ScamChecker" title
**Test**: `npx expo start` shows ScamChecker app in simulator
```bash
npx create-expo-app ScamChecker --template bare-minimum
cd ScamChecker
```
**Deliverable**: Basic Expo app that displays "ScamChecker" on screen

### Task 2: Install Core Dependencies
**Goal**: Add all required npm packages
**Start**: Fresh Expo project
**End**: All dependencies in package.json
**Test**: `npm install` runs without errors
**Dependencies to install**:
```bash
npm install @supabase/supabase-js @reduxjs/toolkit react-redux react-native-url-polyfill @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```
**Deliverable**: Updated package.json with all dependencies

### Task 3: Configure App Config for iOS Only
**Goal**: Set up app.config.js for iOS-only build
**Start**: Default expo config
**End**: Configured for iOS with bundle ID and URL scheme
**Test**: `npx expo prebuild --platform ios` runs successfully
**Deliverable**: app.config.js file with iOS bundle ID "com.yourapp.scamchecker" and URL scheme "scamchecker"

### Task 4: Create Folder Structure
**Goal**: Set up all required directories and index files
**Start**: Basic src/ folder
**End**: Complete folder structure with empty files
**Test**: All folders exist with proper index.ts files
**Deliverable**: Complete directory structure matching architecture (components/, screens/, services/, etc.)

### Task 5: Set Up TypeScript Types
**Goal**: Create all TypeScript type definitions
**Start**: Empty types/ folder
**End**: All interface definitions created
**Test**: TypeScript compilation has no type errors
**Deliverable**: types/analysis.ts and types/supabase.ts with all required interfaces

### Task 6: Create Supabase Project
**Goal**: Set up Supabase backend project
**Start**: No Supabase account/project
**End**: Supabase project with URL and keys
**Test**: Can access Supabase dashboard
**Deliverable**: Supabase project URL, anon key, and service role key

### Task 7: Configure Environment Variables
**Goal**: Set up environment configuration
**Start**: No env configuration
**End**: Environment variables properly configured
**Test**: App can access SUPABASE_URL and SUPABASE_ANON_KEY
**Deliverable**: Environment setup (use expo-constants or similar) with Supabase credentials

### Task 8: Prebuild iOS Project
**Goal**: Generate iOS native project
**Start**: Expo managed project
**End**: ios/ folder with Xcode project
**Test**: Can open ios/ScamChecker.xcworkspace in Xcode
**Deliverable**: Complete ios/ directory with Xcode project files

---

## Backend Setup (Tasks 9-13)

### Task 9: Create Database Schema
**Goal**: Set up analysis_requests table in Supabase
**Start**: Empty Supabase database
**End**: Table created with all required columns
**Test**: Can view table in Supabase dashboard
**Deliverable**: SQL migration creating analysis_requests table with id, screenshot_url, openai_result, created_at, completed_at, analysis_duration_ms columns

### Task 10: Create Screenshots Storage Bucket
**Goal**: Set up file storage for screenshots
**Start**: No storage buckets
**End**: Private screenshots bucket configured
**Test**: Can upload test file to bucket via Supabase dashboard
**Deliverable**: Storage bucket named "screenshots" with proper permissions

### Task 11: Create Edge Function Boilerplate
**Goal**: Set up basic Edge Function structure
**Start**: No Edge Functions
**End**: Deployable Edge Function that returns "Hello World"
**Test**: Can call Edge Function via REST and get response
**Deliverable**: supabase/functions/analyze-screenshot/index.ts with basic HTTP handler

### Task 12: Add OpenAI API to Edge Function
**Goal**: Integrate GPT Vision API into Edge Function
**Start**: Hello World Edge Function
**End**: Edge Function that can call GPT Vision API
**Test**: Edge Function receives image URL and returns GPT response
**Deliverable**: Edge Function that accepts { screenshotUrl } and returns GPT Vision analysis

### Task 13: Complete Edge Function Database Integration
**Goal**: Edge Function saves results to database
**Start**: GPT API integration working
**End**: Full Edge Function with database writes
**Test**: Edge Function creates analysis record and updates with results
**Deliverable**: Complete Edge Function that creates analysis_requests record, calls GPT, and updates with results + timing

---

## Core App Development (Tasks 14-22)

### Task 14: Set Up Redux Store
**Goal**: Configure Redux Toolkit store
**Start**: Empty store/ folder
**End**: Working Redux store with analysis slice
**Test**: Can dispatch actions and see state changes in Redux DevTools
**Deliverable**: store/store.ts and store/analysisSlice.ts with loading, result, error, and analysisId state

### Task 15: Create Supabase Service
**Goal**: Set up Supabase client configuration
**Start**: Empty services/ folder
**End**: Working Supabase client
**Test**: Can successfully connect to Supabase from app
**Deliverable**: services/supabase.ts with initialized Supabase client

### Task 16: Create Analysis Service
**Goal**: Build service to upload images and call Edge Function
**Start**: Supabase client working
**End**: Service with upload and analyze methods
**Test**: Can upload test image and get analysis result
**Deliverable**: services/analysisService.ts with uploadScreenshot() and analyzeScreenshot() functions

### Task 17: Build Loading Spinner Component
**Goal**: Create reusable loading component
**Start**: Empty components/ folder
**End**: Animated loading spinner component
**Test**: Component renders and spins properly
**Deliverable**: components/LoadingSpinner.tsx with animation

### Task 18: Create AnalyzeScreen UI
**Goal**: Build main analysis screen interface
**Start**: Empty screens/ folder
**End**: Screen with loading state and basic layout
**Test**: Screen renders with loading spinner when isLoading=true
**Deliverable**: screens/AnalyzeScreen.tsx with loading UI

### Task 19: Create JsonResultScreen UI
**Goal**: Build results display screen
**Start**: AnalyzeScreen completed
**End**: Screen that displays formatted JSON results
**Test**: Screen renders JSON text in scrollable view
**Deliverable**: screens/JsonResultScreen.tsx with formatted text display and scroll capability

### Task 20: Set Up Navigation
**Goal**: Configure React Navigation between screens
**Start**: Individual screens completed
**End**: Navigation stack with proper screen transitions
**Test**: Can navigate between AnalyzeScreen and JsonResultScreen
**Deliverable**: navigation/AppNavigator.tsx with stack navigation setup

### Task 21: Create App Group Service
**Goal**: Build service to read files from App Group container
**Start**: Navigation working
**End**: Service that can read shared screenshots
**Test**: Can read test file from App Group directory (simulate with local file for now)
**Deliverable**: services/appGroupService.ts with readSharedScreenshot() function

### Task 22: Connect Analysis Flow Logic
**Goal**: Wire up complete analysis flow in AnalyzeScreen
**Start**: All individual pieces working
**End**: Full flow from App Group file to results screen
**Test**: Mock the flow by manually triggering analysis with test image
**Deliverable**: Complete AnalyzeScreen.tsx that checks for shared files, uploads, analyzes, and navigates to results

---

## iOS Share Extension (Tasks 23-28)

### Task 23: Add App Group Entitlement to Main App
**Goal**: Configure App Group for main app
**Start**: Basic iOS app
**End**: App Group entitlement configured
**Test**: App Group appears in app entitlements in Xcode
**Deliverable**: ios/ScamChecker/ScamChecker.entitlements with group.com.yourapp.scamchecker

### Task 24: Create Share Extension Target in Xcode
**Goal**: Add Share Extension to iOS project
**Start**: Main app with App Group
**End**: Share Extension target created in Xcode
**Test**: Share Extension target builds successfully
**Deliverable**: New Share Extension target in Xcode project with basic template files

### Task 25: Configure Share Extension Info.plist
**Goal**: Set up Share Extension to accept images only
**Start**: Default Share Extension template
**End**: Extension only appears for single images
**Test**: Share Extension appears in share sheet when sharing 1 image, not for text or multiple items
**Deliverable**: ShareExtension/Info.plist configured for NSExtensionActivationSupportsImageWithMaxCount = 1

### Task 26: Add App Group Entitlement to Share Extension
**Goal**: Give Share Extension access to App Group container
**Start**: Share Extension with image activation
**End**: Share Extension can access shared container
**Test**: Can write test file to App Group from extension
**Deliverable**: ShareExtension/ShareExtension.entitlements with same App Group ID

### Task 27: Implement Share Extension Logic
**Goal**: Build Swift code to save image and open main app
**Start**: Template Share Extension code
**End**: Extension saves image to App Group and opens main app
**Test**: Share image → saves to container → opens main app → extension dismisses
**Deliverable**: ShareExtension/ShareViewController.swift with complete save + open app logic

### Task 28: Add URL Scheme Handling to Main App
**Goal**: Make main app respond to URL scheme from Share Extension
**Start**: Share Extension opening main app
**End**: Main app navigates to AnalyzeScreen when opened via URL scheme
**Test**: URL scheme "scamchecker://analyze" opens app and goes to AnalyzeScreen
**Deliverable**: iOS app delegate and navigation setup to handle deep links

---

## Integration & Testing (Tasks 29-33)

### Task 29: Test Full Share Extension Flow
**Goal**: Verify complete Share Extension → Main App flow
**Start**: Both Share Extension and Main App working separately
**End**: End-to-end flow from share to analysis results
**Test**: Share screenshot from Photos app → ScamChecker analyzes → shows results
**Deliverable**: Working Share Extension integration with main app

### Task 30: Add Error Handling to Analysis Flow
**Goal**: Handle API failures and network errors gracefully
**Start**: Happy path analysis working
**End**: Proper error states and user feedback
**Test**: Disconnect internet → share image → see appropriate error message
**Deliverable**: Error handling in analysisService.ts and error display in AnalyzeScreen.tsx

### Task 31: Implement JSON Formatting for Results
**Goal**: Make GPT results readable and properly formatted
**Start**: Raw JSON display working
**End**: Clean, formatted text display
**Test**: Long JSON response displays nicely with proper spacing and scrolling
**Deliverable**: utils/formatting.ts with JSON prettification and JsonResultScreen with formatted display

### Task 32: Add File Cleanup After Analysis
**Goal**: Delete screenshot from App Group after analysis
**Start**: Analysis working but files accumulating
**End**: Shared files cleaned up after processing
**Test**: Share multiple images → verify only latest analysis file remains
**Deliverable**: Cleanup logic in AnalyzeScreen after successful analysis

### Task 33: Test on Physical Device
**Goal**: Verify app works on real iPhone
**Start**: Simulator testing complete
**End**: App working on physical iOS device
**Test**: Deploy to test device and complete full share flow from real message apps
**Deliverable**: App running on physical iPhone with Share Extension working from Messages, WhatsApp, etc.

---

## Polish & Deployment (Tasks 34-37)

### Task 34: Add App Icon and Branding
**Goal**: Create proper app icon and branding
**Start**: Default Expo icon
**End**: Custom ScamChecker icon in all required sizes
**Test**: Icon appears correctly in iOS Settings and Home Screen
**Deliverable**: App icon assets and updated app.config.js with icon configuration

### Task 35: Configure Build Settings for TestFlight
**Goal**: Set up proper build configuration for distribution
**Start**: Development build working
**End**: Release build configuration ready
**Test**: Can create archive build in Xcode
**Deliverable**: Proper bundle ID, version numbers, and build settings for App Store distribution

### Task 36: Test Build and Upload to TestFlight
**Goal**: Create first TestFlight build
**Start**: Release configuration ready
**End**: Build uploaded to App Store Connect
**Test**: Build appears in TestFlight ready for testing
**Deliverable**: First TestFlight build uploaded and processed

### Task 37: Set Up TestFlight Test Group
**Goal**: Configure test group and invite initial testers
**Start**: Build in TestFlight
**End**: Test group with your initial testers (you, mom, friend, friend's mom)
**Test**: Test invitations sent and can be accepted
**Deliverable**: TestFlight test group configured with initial beta testers

---

## Task Completion Guidelines

### For Each Task:
1. **Read the task goal carefully** - understand exactly what needs to be accomplished
2. **Verify the starting state** - make sure prerequisites are met
3. **Focus only on the task at hand** - don't add extra features or optimize beyond the task scope
4. **Test the deliverable** - ensure the specific test criteria passes
5. **Commit changes** - make a clear commit message describing what was completed
6. **Report completion** - confirm the task is done and ready for the next task

### Testing Between Tasks:
- Run the app after each task to ensure nothing broke
- Test the specific functionality mentioned in the task
- If tests fail, fix issues before moving to next task
- Keep each task's changes minimal and focused

### Notes:
- Tasks 1-8 can be done in any order but all must be complete before Task 9
- Tasks 9-13 (backend) can be done in parallel with Tasks 14-22 (frontend)  
- Tasks 23-28 (iOS) must be done in sequence and require Tasks 1-8 complete
- Tasks 29-33 (integration) require most previous tasks complete
- Tasks 34-37 (deployment) are final polish and can be done in any order

This plan breaks down the MVP into 37 small, testable tasks that can be completed one at a time with clear verification at each step.