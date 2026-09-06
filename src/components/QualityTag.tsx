import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

/** Tag pequena de qualidade do áudio (MP3, FLAC, kbps). */
export default function QualityTag({ value }: { value: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderColor: colors.textFaint,
    borderRadius: radius.thumb,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  text: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
