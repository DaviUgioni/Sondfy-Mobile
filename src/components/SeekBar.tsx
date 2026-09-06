import React, { useMemo, useRef, useState } from 'react';
import { View, PanResponder, LayoutChangeEvent, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Posição atual controlada, 0..1. */
  progress: number;
  /** Chamado continuamente enquanto o usuário arrasta. */
  onScrub?: (fraction: number) => void;
  /** Chamado ao soltar, com a posição final. */
  onSeek: (fraction: number) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Barra de progresso sensível ao toque: tocar salta para o ponto,
 * arrastar o indicador move para qualquer posição da música.
 */
export default function SeekBar({ progress, onScrub, onSeek }: Props) {
  const widthRef = useRef(0);
  const startXRef = useRef(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubFraction, setScrubFraction] = useState(0);

  // Mantém os callbacks sempre atuais dentro do PanResponder.
  const onScrubRef = useRef(onScrub);
  onScrubRef.current = onScrub;
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const fractionFromX = (x: number) => clamp01(widthRef.current ? x / widthRef.current : 0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = e.nativeEvent.locationX;
          startXRef.current = x;
          const f = fractionFromX(x);
          setScrubbing(true);
          setScrubFraction(f);
          onScrubRef.current?.(f);
        },
        onPanResponderMove: (_e, gesture) => {
          const f = fractionFromX(startXRef.current + gesture.dx);
          setScrubFraction(f);
          onScrubRef.current?.(f);
        },
        onPanResponderRelease: (_e, gesture) => {
          const f = fractionFromX(startXRef.current + gesture.dx);
          setScrubbing(false);
          onSeekRef.current(f);
        },
        onPanResponderTerminate: (_e, gesture) => {
          const f = fractionFromX(startXRef.current + gesture.dx);
          setScrubbing(false);
          onSeekRef.current(f);
        },
      }),
    []
  );

  const shown = clamp01(scrubbing ? scrubFraction : progress);
  const pct = Math.round(shown * 1000) / 10;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.hitArea} onLayout={onLayout} {...pan.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <View style={[styles.knob, scrubbing && styles.knobActive, { left: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Área de toque alta para facilitar o arraste; a barra visível fica no centro.
  hitArea: { height: 28, justifyContent: 'center' },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: colors.primary,
  },
  knobActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    backgroundColor: colors.text,
  },
});
