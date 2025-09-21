import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export const JsonResultScreen: React.FC = () => {
  const { result, analysisId } = useSelector((state: RootState) => state.analysis)
  const screenLoadTime = React.useRef<number>(Date.now())
  const [hasLoggedResultsReady, setHasLoggedResultsReady] = React.useState(false)

  // Component to render formatted analysis text with bold headers
  const FormattedAnalysisText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return <Text style={styles.resultText}>No analysis result available</Text>
    
    // Split text into lines and process each line
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // Check if this line is a section header
      if (trimmedLine === 'Sender Check' || trimmedLine === 'Message Check' || trimmedLine === 'Action') {
        elements.push(
          <Text key={index} style={[styles.resultText, styles.sectionHeader]}>
            {trimmedLine}
          </Text>
        )
      } else if (trimmedLine) {
        // Regular content line
        elements.push(
          <Text key={index} style={styles.resultText}>
            {trimmedLine}
          </Text>
        )
      } else {
        // Empty line for spacing
        elements.push(<Text key={index} style={styles.resultText}> </Text>)
      }
    })
    
    return <>{elements}</>
  }

  // Extract key information if possible
  const extractKeyInfo = (text: string) => {
    const lowerText = text.toLowerCase()
    
    // Check for scam/unsafe indicators
    const isScam = lowerText.includes('scam') || 
                   lowerText.includes('phishing') || 
                   lowerText.includes('fraudulent') ||
                   lowerText.includes('suspicious') ||
                   lowerText.includes('do not click') ||
                   lowerText.includes('do not reply') ||
                   lowerText.includes('block it') ||
                   lowerText.includes('avoid') ||
                   lowerText.includes('fake') ||
                   lowerText.includes('malicious')
    
    // Check for safe indicators
    const isSafe = lowerText.includes('legitimate') || 
                   lowerText.includes('appears safe') ||
                   lowerText.includes('not a scam') ||
                   lowerText.includes('safe to') ||
                   lowerText.includes('genuine') ||
                   lowerText.includes('authentic') ||
                   lowerText.includes('official')
    
    if (isScam) return { status: 'warning', label: 'Potential Scam Detected' }
    if (isSafe) return { status: 'safe', label: 'Appears Safe' }
    return { status: 'neutral', label: 'Analysis Complete' }
  }

  const keyInfo = result ? extractKeyInfo(result) : { status: 'neutral', label: 'No Analysis' }

  // Log timing when results are actually ready and displayed
  React.useEffect(() => {
    console.log('⏱️ TIMING: Results screen mounted at', new Date().toISOString())
    
    if (result && analysisId && !hasLoggedResultsReady) {
      const resultsReadyTime = Date.now()
      const timeFromScreenLoad = resultsReadyTime - screenLoadTime.current
      
      console.log('⏱️ TIMING: Results screen loaded with data')
      console.log(`⏱️ TIMING: Time from screen mount to data ready: ${(timeFromScreenLoad / 1000).toFixed(2)}s`)
      console.log(`⏱️ TIMING: Analysis status detected: ${keyInfo.label}`)
      console.log(`⏱️ TIMING: Results fully rendered at`, new Date().toISOString())
      
      setHasLoggedResultsReady(true)
    } else if (!result || !analysisId) {
      console.log('⏱️ TIMING: Results screen mounted but no data available yet')
      console.log('⏱️ TIMING: Waiting for analysis results...')
    }
  }, [result, analysisId, keyInfo.label, hasLoggedResultsReady])

  // Reset timing when screen comes into focus
  React.useEffect(() => {
    screenLoadTime.current = Date.now()
    setHasLoggedResultsReady(false)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Results</Text>
        {analysisId && (
          <Text style={styles.analysisId}>
            ID: {analysisId.substring(0, 8)}...
          </Text>
        )}
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge, 
          keyInfo.status === 'warning' && styles.warningBadge,
          keyInfo.status === 'safe' && styles.safeBadge,
          keyInfo.status === 'neutral' && styles.neutralBadge
        ]}>
          <Text style={[
            styles.statusText,
            keyInfo.status === 'warning' && styles.warningText,
            keyInfo.status === 'safe' && styles.safeText,
            keyInfo.status === 'neutral' && styles.neutralText
          ]}>
            {keyInfo.status === 'warning' && '⚠️ '}
            {keyInfo.status === 'safe' && '✅ '}
            {keyInfo.status === 'neutral' && '📋 '}
            {keyInfo.label}
          </Text>
        </View>
      </View>

      {/* Scrollable Results */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.resultContainer}>
          <FormattedAnalysisText text={result || ''} />
        </View>
        
        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataLabel}>Analysis Details</Text>
          <Text style={styles.metadataText}>
            • Model: GPT-5 with Vision{'\n'}
            • Analysis ID: {analysisId || 'N/A'}{'\n'}
            • Status: Completed{'\n'}
            • Timestamp: {new Date().toLocaleString()}
          </Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  analysisId: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontFamily: 'Courier',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningBadge: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  safeBadge: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  neutralBadge: {
    backgroundColor: '#e2e3e5',
    borderWidth: 1,
    borderColor: '#d1d3d4',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: '#856404',
  },
  safeText: {
    color: '#155724',
  },
  neutralText: {
    color: '#383d41',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  resultContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'left',
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  metadataContainer: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6c757d',
    fontFamily: 'Courier',
  },
})

export default JsonResultScreen
