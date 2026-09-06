import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { PlayIcon, PauseIcon, LoopIcon, PlusIcon } from './Icon';
import CoverArt from './CoverArt';
import EqualizerBars from './EqualizerBars';
import { formatTime } from '../utils/time';
import type { DownloadedTrack } from '../library/LibraryContext';

type Props = {
  track: DownloadedTrack;
  playing: boolean;
  looping: boolean;
  /** 0..1 */
  progress: number;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  /** Para a música e fecha o mini player. */
  onDismiss?: () => void;
  onPress?: () => void;
};

/** Barra flutuante fixa logo acima da Bottom Bar. */
export default function MiniPlayer({
  track,
  playing,
  looping,
  progress,
  onTogglePlay,
  onToggleLoop,
  onDismiss,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.row}>
        <CoverArt uri={track.thumbnailUrl} size={40} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.missing
              ? 'Arquivo indisponível'
              : `${track.format} · ${track.durationSec ? formatTime(track.durationSec) : '—'}`}
          </Text>
        </View>

        {playing && <EqualizerBars playing size={14} />}

        <TouchableOpacity
          style={[styles.loopBtn, looping && styles.loopBtnActive]}
          onPress={onToggleLoop}
          hitSlop={8}
        >
          <LoopIcon size={18} active={looping} color={looping ? colors.black : colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playBtn} onPress={onTogglePlay} hitSlop={8}>
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </TouchableOpacity>

        {onDismiss && (
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={8}>
            <View style={{ transform: [{ rotate: '45deg' }] }}>
              <PlusIcon size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.sm,
    backgroundColor: colors.player,
    borderRadius: radius.sm,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  info: { flex: 1 },
  title: { color: colors.text, ...typography.cardTitle },
  artist: { color: colors.textMuted, ...typography.caption, marginTop: 1 },
  loopBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
  },
  loopBtnActive: { backgroundColor: colors.primary },
  playBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.text,
  },
});
