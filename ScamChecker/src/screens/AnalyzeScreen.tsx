import React, { useEffect } from 'react'
import { View, Text, StyleSheet, SafeAreaView, Linking } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootState, AppDispatch } from '../store'
import { setLoading, setResult, setError, clearAnalysis } from '../store/analysisSlice'
import { LoadingSpinner } from '../components'
import { uploadAndAnalyze, readSharedScreenshot, deleteSharedScreenshot, clearOldScreenshots } from '../services'
import { RootStackParamList } from '../navigation'

type AnalyzeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analyze'>

export const AnalyzeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useNavigation<AnalyzeScreenNavigationProp>()
  const route = useRoute()
  const { isLoading, result, error, analysisId } = useSelector(
    (state: RootState) => state.analysis
  )
  
  // Ref to prevent multiple simultaneous analysis attempts
  const isAnalyzing = React.useRef(false)
  const lastCheckedFile = React.useRef<string | null>(null)
  const currentAnalysisId = React.useRef<string | null>(null)
  
  // Timing tracking
  const analysisStartTime = React.useRef<number | null>(null)
  const loadingStartTime = React.useRef<number | null>(null)
  const resultsScreenStartTime = React.useRef<number | null>(null)
  const lastFocusTime = React.useRef<number>(0)
  const hasCleanedUp = React.useRef<boolean>(false)
  const isFromShareExtension = React.useRef<boolean>(false)

  // Function to check for shared screenshot from App Group
  const checkForSharedScreenshot = async (): Promise<string | null> => {
    try {
      // Check App Group for shared screenshots
      const sharedScreenshot = await readSharedScreenshot()
      
      if (sharedScreenshot) {
        console.log(`📱 Found shared screenshot: ${sharedScreenshot.filename}`)
        return sharedScreenshot.uri
      }
      
      console.log('📱 No shared screenshot found')
      return null
      
    } catch (error) {
      console.error('Error checking for shared screenshot:', error)
      return null
    }
  }

  // Function to analyze a shared screenshot from App Group
  const startAnalysisWithSharedScreenshot = async (screenshotPath: string) => {
    // Prevent multiple simultaneous analyses
    if (isAnalyzing.current) {
      console.log('⏳ Analysis already in progress, skipping...')
      return
    }
    
    let sharedScreenshot = null
    
    try {
      isAnalyzing.current = true
      analysisStartTime.current = Date.now()
      loadingStartTime.current = Date.now()
      dispatch(setLoading(true))
      console.log('🔍 Starting complete analysis flow for shared screenshot...')
      console.log('⏱️ TIMING: Analysis started at', new Date().toISOString())
      
      // Get the shared screenshot object for cleanup later
      sharedScreenshot = await readSharedScreenshot()
      
      if (!sharedScreenshot) {
        throw new Error('Shared screenshot not found')
      }
      
      console.log(`📱 Processing shared screenshot: ${sharedScreenshot.filename}`)
      console.log(`📁 File size: ${(sharedScreenshot.size / 1024).toFixed(2)} KB`)
      
      // Complete analysis flow: upload to Supabase Storage + analyze with GPT
      const analysisResult = await uploadAndAnalyze(screenshotPath)
      
      // Store the current analysis ID before dispatching
      currentAnalysisId.current = analysisResult.analysisId
      
      // Reset analyzing flag BEFORE state update to allow navigation
      isAnalyzing.current = false
      
      const analysisEndTime = Date.now()
      const totalAnalysisTime = analysisStartTime.current ? analysisEndTime - analysisStartTime.current : 0
      const loadingTime = loadingStartTime.current ? analysisEndTime - loadingStartTime.current : 0
      
      console.log('✅ Complete analysis flow completed successfully')
      console.log(`📊 Analysis ID: ${analysisResult.analysisId}`)
      console.log(`⏱️ TIMING: Total analysis time: ${(totalAnalysisTime / 1000).toFixed(2)}s`)
      console.log(`⏱️ TIMING: Loading screen duration: ${(loadingTime / 1000).toFixed(2)}s`)
      
      // Clean up: delete the shared screenshot after successful analysis
      if (sharedScreenshot) {
        const deleted = await deleteSharedScreenshot(sharedScreenshot)
        if (deleted) {
          console.log('🗑️ Shared screenshot cleaned up successfully')
        }
      }
      
      console.log('🎯 Analysis complete, dispatching state update for navigation')
      
      // Dispatch state update AFTER everything is ready for navigation
      dispatch(setResult({
        analysisId: analysisResult.analysisId,
        result: analysisResult.result
      }))
      
    } catch (error) {
      console.error('❌ Complete analysis flow failed:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Analysis failed'))
      
      // Still try to clean up the shared screenshot on error
      if (sharedScreenshot) {
        try {
          await deleteSharedScreenshot(sharedScreenshot)
          console.log('🗑️ Shared screenshot cleaned up after error')
        } catch (cleanupError) {
          console.error('Failed to cleanup shared screenshot:', cleanupError)
        }
      }
    } finally {
      // Always reset the analyzing flag
      isAnalyzing.current = false
    }
  }

  // Navigate to results when the CURRENT analysis is complete and state is updated
  React.useEffect(() => {
    console.log('🔍 Navigation effect triggered:', {
      currentAnalysisId: currentAnalysisId.current,
      analysisId,
      hasResult: !!result,
      isLoading,
      isAnalyzing: isAnalyzing.current
    })
    
    // Only navigate if this is the analysis we're currently waiting for AND no analysis is running
    if (currentAnalysisId.current && 
        analysisId === currentAnalysisId.current && 
        result && 
        !isLoading &&
        !isAnalyzing.current) {
      
      const stateUpdateTime = Date.now()
      const stateUpdateDelay = analysisStartTime.current ? stateUpdateTime - analysisStartTime.current : 0
      
      console.log('🔄 State updated with CURRENT analysis results, navigating to results screen')
      console.log(`⏱️ TIMING: State update delay: ${(stateUpdateDelay / 1000).toFixed(2)}s`)
      console.log(`🎯 TIMING: Current analysis ID matches: ${currentAnalysisId.current}`)
      
      // Reset tracking
      currentAnalysisId.current = null
      lastCheckedFile.current = null
      resultsScreenStartTime.current = Date.now()
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        console.log('⏱️ TIMING: Navigating to results screen at', new Date().toISOString())
        navigation.navigate('Results')
      }, 100)
    } else if (currentAnalysisId.current && analysisId !== currentAnalysisId.current) {
      console.log(`⏳ TIMING: Waiting for current analysis ${currentAnalysisId.current}, but got ${analysisId}`)
    } else if (isAnalyzing.current && currentAnalysisId.current) {
      console.log(`⏳ TIMING: Analysis ${currentAnalysisId.current} still in progress, delaying navigation`)
    } else if (!currentAnalysisId.current) {
      console.log('⏳ TIMING: No current analysis ID set, not navigating')
    }
  }, [result, analysisId, isLoading, navigation])

  // Detect if app was launched from Share Extension or receives URL while running
  React.useEffect(() => {
    const checkInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL()
        if (url && url.includes('scamchecker://analyze')) {
          console.log('🔗 App launched from Share Extension:', url)
          isFromShareExtension.current = true
        } else {
          console.log('📱 App launched directly (no URL scheme)')
          isFromShareExtension.current = false
        }
      } catch (error) {
        console.log('❌ Error checking initial URL:', error)
        isFromShareExtension.current = false
      }
    }
    
    // Handle URLs received while app is running
    const handleURL = ({ url }: { url: string }) => {
      if (url.includes('scamchecker://analyze')) {
        console.log('🔗 AnalyzeScreen received URL while running:', url)
        isFromShareExtension.current = true
        // Force a re-check by clearing the debounce timer and triggering analysis
        lastFocusTime.current = 0
        console.log('🔄 URL received - forcing analysis check...')
        
        // Manually trigger the analysis flow since we're already on AnalyzeScreen
        setTimeout(() => {
          const initializeAnalysis = async () => {
            try {
              console.log('🔍 Manual analysis trigger from URL...')
              
              // Clear state for fresh start
              dispatch(clearAnalysis())
              currentAnalysisId.current = null
              lastCheckedFile.current = null
              isAnalyzing.current = false
              
              // Clean up old screenshots, keep only the newest
              if (!hasCleanedUp.current) {
                await clearOldScreenshots()
                hasCleanedUp.current = true
              }
              
              // Check for shared screenshot
              const sharedScreenshotPath = await checkForSharedScreenshot()
              
              if (sharedScreenshotPath) {
                if (isAnalyzing.current) {
                  console.log('📱 Analysis already in progress, skipping...')
                  return
                }
                
                console.log('📱 Found shared screenshot from URL trigger, starting analysis...')
                lastCheckedFile.current = sharedScreenshotPath
                startAnalysisWithSharedScreenshot(sharedScreenshotPath)
                isFromShareExtension.current = false
              } else {
                console.log('📱 No shared screenshot found from URL trigger')
                dispatch(setError('No screenshot found. Please share a screenshot using the iOS Share Sheet.'))
                isFromShareExtension.current = false
              }
            } catch (error) {
              console.error('Error in manual analysis trigger:', error)
              dispatch(setError('Failed to check for shared screenshot'))
            }
          }
          
          initializeAnalysis()
        }, 100) // Small delay to ensure navigation is complete
      }
    }
    
    checkInitialURL()
    
    // Listen for URL events while app is running
    const subscription = Linking.addEventListener('url', handleURL)
    
    return () => subscription?.remove()
  }, [])

  // Listen for navigation parameters that trigger analysis
  React.useEffect(() => {
    const params = route.params as { triggerAnalysis?: boolean; timestamp?: number } | undefined
    if (params?.triggerAnalysis) {
      console.log('🎯 Analysis triggered by navigation parameter:', params.timestamp)
      
      // Trigger analysis manually
      const triggerAnalysis = async () => {
        try {
          console.log('🔍 Parameter-triggered analysis starting...')
          
          // Clear state for fresh start
          dispatch(clearAnalysis())
          currentAnalysisId.current = null
          lastCheckedFile.current = null
          isAnalyzing.current = false
          
          // Clean up old screenshots, keep only the newest
          if (!hasCleanedUp.current) {
            await clearOldScreenshots()
            hasCleanedUp.current = true
          }
          
          // Check for shared screenshot
          const sharedScreenshotPath = await checkForSharedScreenshot()
          
          if (sharedScreenshotPath) {
            if (isAnalyzing.current) {
              console.log('📱 Analysis already in progress, skipping...')
              return
            }
            
            console.log('📱 Found shared screenshot from parameter trigger, starting analysis...')
            lastCheckedFile.current = sharedScreenshotPath
            startAnalysisWithSharedScreenshot(sharedScreenshotPath)
          } else {
            console.log('📱 No shared screenshot found from parameter trigger')
            dispatch(setError('No screenshot found. Please share a screenshot using the iOS Share Sheet.'))
          }
        } catch (error) {
          console.error('Error in parameter-triggered analysis:', error)
          dispatch(setError('Failed to check for shared screenshot'))
        }
      }
      
      triggerAnalysis()
    }
  }, [route.params])

  // Check for shared screenshot when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const initializeAnalysis = async () => {
        try {
          // Debounce rapid focus events
          const now = Date.now()
          if (now - lastFocusTime.current < 1000) { // 1 second debounce
            console.log('🔍 Screen focus debounced, skipping...')
            return
          }
          lastFocusTime.current = now
          
          console.log('🔍 Screen focused - checking launch method...')
          
          // Always clear state for fresh start (no back button now)
          dispatch(clearAnalysis())
          // Reset all tracking variables for fresh start
          currentAnalysisId.current = null
          lastCheckedFile.current = null
          isAnalyzing.current = false
          console.log('🔄 Cleared previous analysis state for fresh start')
          
          // Check current URL state (might have been updated by URL listener)
          console.log(`📱 Current Share Extension flag: ${isFromShareExtension.current}`)
          
          // Only check for screenshots if launched from Share Extension
          if (isFromShareExtension.current) {
            console.log('📱 Launched from Share Extension - checking for screenshots...')
            
            // Clean up old screenshots, keep only the newest (just shared)
            if (!hasCleanedUp.current) {
              await clearOldScreenshots()
              hasCleanedUp.current = true
            }
            
            // Check if there's a shared screenshot from Share Extension
            const sharedScreenshotPath = await checkForSharedScreenshot()
            
            if (sharedScreenshotPath) {
              // Prevent duplicate processing only if analysis is currently running
              if (isAnalyzing.current) {
                console.log('📱 Analysis already in progress, skipping...')
                return
              }
              
              console.log('📱 Found shared screenshot, starting analysis...')
              // Set this IMMEDIATELY to prevent duplicate processing
              lastCheckedFile.current = sharedScreenshotPath
              // Start analysis with the shared screenshot
              startAnalysisWithSharedScreenshot(sharedScreenshotPath)
              // Reset flag after processing
              isFromShareExtension.current = false
            } else {
              console.log('📱 No shared screenshot found from Share Extension')
              dispatch(setError('No screenshot found. Please share a screenshot using the iOS Share Sheet.'))
              // Reset flag after processing
              isFromShareExtension.current = false
            }
          } else {
            console.log('📱 Direct app launch - showing ready state')
            // Don't dispatch anything - let it fall through to default "waiting" state
            // This shows the nice instructions for how to use the app
          }
        } catch (error) {
          console.error('Error initializing analysis:', error)
          dispatch(setError('Failed to check for shared screenshot'))
        }
      }

      initializeAnalysis()
    }, []) // Only run when screen comes into focus, not when result changes
  )

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>ScamChecker</Text>
          <Text style={styles.subtitle}>Analyzing your screenshot...</Text>
          
          <View style={styles.loadingContainer}>
            <LoadingSpinner 
              size="large" 
              color="#007AFF" 
              message="Please wait while we analyze the screenshot for potential scams"
            />
          </View>
          
          <Text style={styles.hint}>
            This may take a few seconds
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>ScamChecker</Text>
          <Text style={styles.subtitle}>Analysis Failed</Text>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.errorHint}>
              Please try again or check your internet connection
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Render success state (analysis completed)
  if (result && analysisId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>ScamChecker</Text>
          <Text style={styles.subtitle}>Analysis Complete</Text>
          
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>
              Screenshot analyzed successfully
            </Text>
            <Text style={styles.analysisId}>
              Analysis ID: {analysisId.substring(0, 8)}...
            </Text>
            <Text style={styles.hint}>
              Share another screenshot to analyze it, or tap below to view results.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Default state - waiting for shared screenshot
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ScamChecker</Text>
        <Text style={styles.subtitle}>Waiting for screenshot...</Text>
        <Text style={styles.hint}>
          To analyze a screenshot:{'\n\n'}
          1. Take a screenshot{'\n'}
          2. Tap the Share button{'\n'}
          3. Select ScamChecker{'\n\n'}
          The analysis will start automatically.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successMessage: {
    fontSize: 18,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  analysisId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    fontFamily: 'Courier',
  },
})

export default AnalyzeScreen

