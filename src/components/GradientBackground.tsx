import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

/**
 * Degradê suave descendo do topo da tela — sem dependências nativas.
 * Empilha faixas de opacidade decrescente de um tint sobre o fundo base.
 */

type Props = {
  children?: React.ReactNode;
  /** Cor do tint no topo (default: cinza do topo das telas). */
  tint?: string;
  style?: ViewStyle;
  /** Altura do degradê em px (default 260). */
  height?: number;
  /** Opacidade do tint no topo (default 0.55). */
  maxOpacity?: number;
};

const BANDS = 8;

export default function GradientBackground({
  children,
  tint = colors.bgGradientTop,
  style,
  height = 260,
  maxOpacity = 0.55,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={[styles.gradient, { height }]} pointerEvents="none">
        {Array.from({ length: BANDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: tint,
              opacity: (1 - i / BANDS) * maxOpacity,
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
