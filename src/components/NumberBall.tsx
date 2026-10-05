import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../theme/tokens';

interface NumberBallProps {
  number: number;
  size?: number;
  color: string;
  animated?: boolean;
  delay?: number;
  revealed?: boolean;
}

export default function NumberBall({
  number,
  size = 44,
  color,
  animated = false,
  delay = 0,
  revealed = true,
}: NumberBallProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated && revealed) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated, revealed, delay, number]);

  const label = number.toString().padStart(2, '0');

  return (
    <Animated.View
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Glossy highlight */}
      <View style={[styles.highlight, { width: size * 0.5, height: size * 0.25, borderRadius: size * 0.15 }]} />
      <Text style={[styles.number, { fontSize: size * 0.36 }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ball: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  highlight: {
    position: 'absolute',
    top: '15%',
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  number: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
