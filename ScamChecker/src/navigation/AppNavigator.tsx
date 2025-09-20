import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AnalyzeScreen, JsonResultScreen } from '../screens'

// Define the navigation stack parameter list
export type RootStackParamList = {
  Analyze: undefined
  Results: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
          }}
        />
        <Stack.Screen
          name="Results"
          component={JsonResultScreen}
          options={{
            title: 'Analysis Results',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
