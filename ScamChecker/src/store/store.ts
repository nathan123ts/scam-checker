import { configureStore } from '@reduxjs/toolkit'
import analysisReducer from './analysisSlice'

// Configure Redux store
export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
  },
  // Enable Redux DevTools in development
  devTools: __DEV__,
})

// Export store types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
