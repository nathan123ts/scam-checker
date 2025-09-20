import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Text, ViewStyle } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  message?: string
  style?: ViewStyle
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#007AFF',
  message,
  style
}) => {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Start the spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    )
    
    spinAnimation.start()
    
    // Cleanup function to stop animation
    return () => spinAnimation.stop()
  }, [spinValue])

  // Convert the animated value to a rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  // Size configurations
  const sizeConfig = {
    small: { width: 20, height: 20, borderWidth: 2 },
    medium: { width: 40, height: 40, borderWidth: 3 },
    large: { width: 60, height: 60, borderWidth: 4 },
  }

  const spinnerSize = sizeConfig[size]

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinner,
          spinnerSize,
          {
            borderColor: color,
            borderTopColor: 'transparent',
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {message && (
        <Text style={[styles.message, { color }]}>
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderRadius: 50,
    borderStyle: 'solid',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
})

export default LoadingSpinner
