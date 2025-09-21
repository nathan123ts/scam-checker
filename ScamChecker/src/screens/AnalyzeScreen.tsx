import React, { useEffect } from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootState, AppDispatch } from '../store'
import { setLoading, setResult, setError } from '../store/analysisSlice'
import { LoadingSpinner } from '../components'
import { uploadAndAnalyze, readSharedScreenshot, deleteSharedScreenshot } from '../services'
import { RootStackParamList } from '../navigation'

type AnalyzeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analyze'>

export const AnalyzeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useNavigation<AnalyzeScreenNavigationProp>()
  const { isLoading, result, error, analysisId } = useSelector(
    (state: RootState) => state.analysis
  )

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
    let sharedScreenshot = null
    
    try {
      dispatch(setLoading(true))
      console.log('🔍 Starting complete analysis flow for shared screenshot...')
      
      // Get the shared screenshot object for cleanup later
      sharedScreenshot = await readSharedScreenshot()
      
      if (!sharedScreenshot) {
        throw new Error('Shared screenshot not found')
      }
      
      console.log(`📱 Processing shared screenshot: ${sharedScreenshot.filename}`)
      console.log(`📁 File size: ${(sharedScreenshot.size / 1024).toFixed(2)} KB`)
      
      // Complete analysis flow: upload to Supabase Storage + analyze with GPT
      const analysisResult = await uploadAndAnalyze(screenshotPath)
      
      dispatch(setResult({
        analysisId: analysisResult.analysisId,
        result: analysisResult.result
      }))
      
      console.log('✅ Complete analysis flow completed successfully')
      console.log(`📊 Analysis ID: ${analysisResult.analysisId}`)
      
      // Clean up: delete the shared screenshot after successful analysis
      if (sharedScreenshot) {
        const deleted = await deleteSharedScreenshot(sharedScreenshot)
        if (deleted) {
          console.log('🗑️ Shared screenshot cleaned up successfully')
        }
      }
      
      // Navigate to results screen after successful analysis
      setTimeout(() => {
        navigation.navigate('Results')
      }, 1000) // Small delay to show success state briefly
      
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
    }
  }

  // Check for shared screenshot when component mounts
  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        console.log('🔍 App launched - checking for shared screenshot from Share Extension...')
        
        // Check if there's a shared screenshot from Share Extension
        const sharedScreenshotPath = await checkForSharedScreenshot()
        
        if (sharedScreenshotPath) {
          console.log('📱 Found shared screenshot, starting analysis...')
          // Start analysis with the shared screenshot
          startAnalysisWithSharedScreenshot(sharedScreenshotPath)
        } else {
          console.log('📱 No shared screenshot found')
          // Show message that user should share a screenshot
          dispatch(setError('No screenshot found. Please share a screenshot using the iOS Share Sheet.'))
        }
      } catch (error) {
        console.error('Error initializing analysis:', error)
        dispatch(setError('Failed to check for shared screenshot'))
      }
    }

    initializeAnalysis()
  }, [])

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
