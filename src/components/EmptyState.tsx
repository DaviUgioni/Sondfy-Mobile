import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { MusicNoteIcon } from './Icon';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vazio: ilustração minimalista cinza + mensagem curta centralizada. */
export default function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.illustration}>
        <View style={styles.card1} />
        <View style={styles.card2} />
        <View style={styles.noteCircle}>
          <MusicNoteIcon size={30} color={colors.textFaint} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 80,
  },
  illustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  card1: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    transform: [{ rotate: '-12deg' }, { translateX: -10 }],
  },
  card2: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: radius.card,
    backgroundColor: colors.cardElevated,
    transform: [{ rotate: '10deg' }, { translateX: 10 }],
  },
  noteCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, ...typography.section, fontSize: 18, textAlign: 'center' },
  message: {
    color: colors.textMuted,
    ...typography.caption,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  action: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  actionText: { color: colors.black, ...typography.pill },
});
