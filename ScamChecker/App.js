import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Linking } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';

export default function App() {
  useEffect(() => {
    console.log('🚀 ScamChecker App starting...');
    
    // Handle URL scheme when app is opened from Share Extension
    const handleURL = (url) => {
      console.log('📱 App opened with URL:', url);
      if (url && url.includes('scamchecker://')) {
        console.log('✅ Valid ScamChecker URL scheme detected');
        console.log('🔄 Navigation should handle automatically via AnalyzeScreen');
      } else {
        console.log('❌ Invalid or missing URL scheme');
      }
    };

    // Handle initial URL (app opened from Share Extension)
    console.log('🔍 Checking for initial URL...');
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📥 Initial URL found:', url);
        handleURL(url);
      } else {
        console.log('📭 No initial URL (normal app launch)');
      }
    }).catch((error) => {
      console.log('❌ Error getting initial URL:', error);
    });

    // Handle URLs when app is already running
    console.log('👂 Setting up URL listener...');
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('📨 Received URL while app running:', url);
      handleURL(url);
    });

    return () => {
      console.log('🧹 Cleaning up URL listeners...');
      subscription?.remove();
    };
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
