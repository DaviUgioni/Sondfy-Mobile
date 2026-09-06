import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala mínima ao pressionar (default 0.97). */
  activeScale?: number;
};

/** Feedback de clique suave (active state) para cards e botões. */
export default function PressableScale({ children, style, activeScale = 0.97, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  return (
    <Pressable
      onPressIn={() => to(activeScale)}
      onPressOut={() => to(1)}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
