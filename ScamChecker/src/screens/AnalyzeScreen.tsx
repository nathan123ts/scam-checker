import React, { useEffect } from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootState, AppDispatch } from '../store'
import { setLoading, setResult, setError } from '../store/analysisSlice'
import { LoadingSpinner } from '../components'
import { analyzeScreenshot } from '../services'
import { RootStackParamList } from '../navigation'

type AnalyzeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analyze'>

export const AnalyzeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useNavigation<AnalyzeScreenNavigationProp>()
  const { isLoading, result, error, analysisId } = useSelector(
    (state: RootState) => state.analysis
  )

  // Mock function to simulate checking for shared screenshot
  // In real implementation, this would check App Group container
  const checkForSharedScreenshot = async (): Promise<string | null> => {
    // Simulate checking App Group for shared screenshot
    // For now, return null (no screenshot found)
    return null
  }

  // Function to start analysis with a test image
  const startAnalysis = async () => {
    try {
      dispatch(setLoading(true))
      
      // For testing, use the same image URL we used before
      const testImageUrl = "https://yjyziszwmrwycodfkjac.supabase.co/storage/v1/object/sign/screenshots/Screenshot%202025-03-24%20at%203.19.09%20PM.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMDU1MzUwNi1kNzFiLTRjZjEtYTQ4OS00N2VmNTkxNGQ1ZTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzY3JlZW5zaG90cy9TY3JlZW5zaG90IDIwMjUtMDMtMjQgYXQgMy4xOS4wOSBQTS5qcGVnIiwiaWF0IjoxNzU4Mzg1Mzc3LCJleHAiOjE3NTg5OTAxNzd9.viUTtfCfCW8DqW5TaAUl15vbe8xgDV4Qmam1VO6YQok"
      
      console.log('🔍 Starting analysis from AnalyzeScreen...')
      const analysisResult = await analyzeScreenshot(testImageUrl)
      
      dispatch(setResult({
        analysisId: analysisResult.analysisId,
        result: analysisResult.result
      }))
      
      console.log('✅ Analysis completed in AnalyzeScreen')
      
      // Navigate to results screen after successful analysis
      setTimeout(() => {
        navigation.navigate('Results')
      }, 1000) // Small delay to show success state briefly
      
    } catch (error) {
      console.error('❌ Analysis failed in AnalyzeScreen:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Analysis failed'))
    }
  }

  // Check for shared screenshot when component mounts
  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        // Check if there's a shared screenshot from Share Extension
        const sharedScreenshotPath = await checkForSharedScreenshot()
        
        if (sharedScreenshotPath) {
          // TODO: In real implementation, upload the shared screenshot
          // and then analyze it
          console.log('Found shared screenshot:', sharedScreenshotPath)
          // startAnalysis() would be called here
        } else {
          // For testing purposes, auto-start analysis after 1 second
          setTimeout(() => {
            startAnalysis()
          }, 1000)
        }
      } catch (error) {
        console.error('Error initializing analysis:', error)
        dispatch(setError('Failed to initialize analysis'))
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
            <Text style={styles.errorIcon}>⚠️</Text>
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
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successMessage}>
              Screenshot analyzed successfully
            </Text>
            <Text style={styles.analysisId}>
              Analysis ID: {analysisId.substring(0, 8)}...
            </Text>
            <Text style={styles.resultPreview}>
              {result.substring(0, 150)}...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Default state (shouldn't normally be reached)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ScamChecker</Text>
        <Text style={styles.subtitle}>Ready to analyze</Text>
        <Text style={styles.hint}>
          Share a screenshot to begin analysis
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  resultPreview: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
})

export default AnalyzeScreen
