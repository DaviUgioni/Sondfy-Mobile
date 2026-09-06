import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Barras animam quando true; ficam baixas e estáticas quando false. */
  playing?: boolean;
  color?: string;
  size?: number;
};

/** Barras de equalizador verdes piscando ao lado da faixa em reprodução. */
export default function EqualizerBars({ playing = true, color = colors.primary, size = 16 }: Props) {
  const bars = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!playing) {
      bars.forEach((b) => Animated.timing(b, { toValue: 0.25, duration: 200, useNativeDriver: true }).start());
      return;
    }
    const loops = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, {
            toValue: 1,
            duration: 320 + i * 90,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: 0.3,
            duration: 260 + i * 70,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, bars]);

  return (
    <View style={[styles.row, { height: size }]}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: 2.5,
            height: size,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ scaleY: b }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
});
