import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';

export default function App() {
  useEffect(() => {
    console.log('🚀 ScamChecker App starting...');
  }, []);

  return (
    <Provider store={store}>
      <AppNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}

const styles = StyleSheet.create({
  // Styles removed - using AppNavigator
});
