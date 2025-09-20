import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { clearAnalysis } from '../store/analysisSlice'

export const JsonResultScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { result, analysisId } = useSelector((state: RootState) => state.analysis)

  const handleStartNewAnalysis = () => {
    dispatch(clearAnalysis())
    // In a real app with navigation, this would navigate back to AnalyzeScreen
  }

  // Format the analysis result for better readability
  const formatAnalysisResult = (text: string): string => {
    if (!text) return 'No analysis result available'
    
    // Add line breaks for better readability
    return text
      .replace(/\d+\./g, '\n$&') // Add line break before numbered points
      .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2') // Add paragraph breaks
      .trim()
  }

  const formattedResult = result ? formatAnalysisResult(result) : 'No analysis result available'

  // Extract key information if possible
  const extractKeyInfo = (text: string) => {
    const isScam = text.toLowerCase().includes('scam') || 
                   text.toLowerCase().includes('phishing') || 
                   text.toLowerCase().includes('fraudulent')
    
    const isSafe = text.toLowerCase().includes('legitimate') || 
                   text.toLowerCase().includes('appears safe') ||
                   text.toLowerCase().includes('not a scam')
    
    if (isScam) return { status: 'warning', label: 'Potential Scam Detected' }
    if (isSafe) return { status: 'safe', label: 'Appears Safe' }
    return { status: 'neutral', label: 'Analysis Complete' }
  }

  const keyInfo = result ? extractKeyInfo(result) : { status: 'neutral', label: 'No Analysis' }

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
          <Text style={styles.resultLabel}>GPT-4o Analysis:</Text>
          <Text style={styles.resultText}>
            {formattedResult}
          </Text>
        </View>
        
        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataLabel}>Analysis Details</Text>
          <Text style={styles.metadataText}>
            • Model: GPT-4o with Vision{'\n'}
            • Analysis ID: {analysisId || 'N/A'}{'\n'}
            • Status: Completed{'\n'}
            • Timestamp: {new Date().toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleStartNewAnalysis}
        >
          <Text style={styles.actionButtonText}>
            Analyze Another Screenshot
          </Text>
        </TouchableOpacity>
      </View>
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
  resultLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'left',
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
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default JsonResultScreen
