import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Analysis state interface
export interface AnalysisState {
  isLoading: boolean
  result: string | null
  error: string | null
  analysisId: string | null
}

// Initial state
const initialState: AnalysisState = {
  isLoading: false,
  result: null,
  error: null,
  analysisId: null,
}

// Analysis slice
const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Start analysis - set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      if (action.payload) {
        // Clear previous results when starting new analysis
        state.result = null
        state.error = null
        state.analysisId = null
      }
    },

    // Set analysis result
    setResult: (state, action: PayloadAction<{ analysisId: string; result: string }>) => {
      state.isLoading = false
      state.analysisId = action.payload.analysisId
      state.result = action.payload.result
      state.error = null
    },

    // Set error state
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
      state.result = null
      state.analysisId = null
    },

    // Clear all analysis state
    clearAnalysis: (state) => {
      state.isLoading = false
      state.result = null
      state.error = null
      state.analysisId = null
    },
  },
})

// Export actions
export const { setLoading, setResult, setError, clearAnalysis } = analysisSlice.actions

// Export reducer
export default analysisSlice.reducer
