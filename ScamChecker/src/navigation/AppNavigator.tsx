import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Linking } from 'react-native'
import { AnalyzeScreen, JsonResultScreen } from '../screens'

// Define the navigation stack parameter list
export type RootStackParamList = {
  Analyze: undefined
  Results: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator: React.FC = () => {
  const navigationRef = React.useRef<any>(null)

  // Handle URL navigation when app receives new screenshot
  React.useEffect(() => {
    const handleURL = (url: string) => {
      console.log('🔗 AppNavigator received URL:', url)
      if (url.includes('scamchecker://analyze')) {
        console.log('📱 New screenshot shared - navigating to AnalyzeScreen')
        // Force navigation to AnalyzeScreen for new screenshot
        navigationRef.current?.navigate('Analyze')
      }
    }

    // Listen for URLs when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleURL(url)
    })

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleURL(url)
      }
    })

    return () => subscription?.remove()
  }, [])

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Analyze"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#007AFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Analyze"
          component={AnalyzeScreen}
          options={{
            title: 'ScamChecker',
            headerLargeTitle: false,
            headerBackVisible: false, // Hide back button
            headerLeft: () => null, // Remove back button completely
            gestureEnabled: false, // Disable swipe back gesture
          }}
        />
        <Stack.Screen
          name="Results"
          component={JsonResultScreen}
          options={{
            title: 'Analysis Results',
            headerBackVisible: false, // Hide back button
            headerLeft: () => null, // Remove back button completely
            gestureEnabled: false, // Disable swipe back gesture
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
