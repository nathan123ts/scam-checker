import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import { JsonResultScreen } from './src/screens';
import { setResult } from './src/store/analysisSlice';

function AppContent() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Set mock data to test JsonResultScreen
    dispatch(setResult({
      analysisId: 'test-123-456-789',
      result: 'This screenshot appears to be a phishing attempt. 1. The URL shown is suspicious and does not match the legitimate website. 2. There are several grammatical errors and urgent language designed to pressure the user. 3. The request for personal information like passwords is a major red flag. 4. The visual design has inconsistencies with the legitimate brand. I would strongly advise against clicking any links or providing any information requested in this message.'
    }));
  }, [dispatch]);

  return <JsonResultScreen />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
      <StatusBar style="auto" />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
