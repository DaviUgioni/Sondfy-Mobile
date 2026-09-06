import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, radius, typography } from '../theme';
import { usePlayer } from '../player/PlayerContext';
import { formatTime } from '../utils/time';
import GradientBackground from '../components/GradientBackground';
import CoverArt from '../components/CoverArt';
import QualityTag from '../components/QualityTag';
import SeekBar from '../components/SeekBar';
import {
  PlayIcon,
  PauseIcon,
  SkipIcon,
  LoopIcon,
  ChevronRight,
  DownloadedBadge,
} from '../components/Icon';

const { width } = Dimensions.get('window');
const COVER = Math.min(width - spacing.xl * 2, 360);

export default function PlayerScreen() {
  const navigation = useNavigation();
  const {
    track,
    playing,
    looping,
    progress,
    elapsedSec,
    durationSec,
    togglePlay,
    toggleLoop,
    next,
    previous,
    seek,
  } = usePlayer();

  // Posição mostrada enquanto o usuário arrasta a barra.
  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    if (!track) navigation.goBack();
  }, [track, navigation]);

  if (!track) return null;

  const shownSec = scrub != null ? Math.round(scrub * durationSec) : elapsedSec;
  const remaining = Math.max(0, durationSec - shownSec);

  return (
    <GradientBackground tint={colors.surface} height={640} maxOpacity={0.9}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.chevronDown}>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topLabel}>TOCANDO DO DISPOSITIVO</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.coverWrap}>
          <CoverArt uri={track.thumbnailUrl} size={COVER} borderRadius={radius.card} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <View style={styles.subRow}>
            <DownloadedBadge size={14} />
            <Text style={styles.sub} numberOfLines={1}>
              {formatTime(track.durationSec)} · {track.sizeMB.toFixed(1)} MB
            </Text>
            <QualityTag value={track.format} />
          </View>

          {/* Barra de progresso deslizável */}
          <View style={styles.progressBlock}>
            <SeekBar
              progress={progress}
              onScrub={setScrub}
              onSeek={(f) => {
                seek(f);
                setScrub(null);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatTime(shownSec)}</Text>
              <Text style={styles.time}>-{formatTime(remaining)}</Text>
            </View>
          </View>

          {/* Controles: Anterior · Play/Pause · Próximo · Loop */}
          <View style={styles.controls}>
            <View style={styles.sideSlot} />
            <TouchableOpacity onPress={previous} hitSlop={12}>
              <SkipIcon size={30} dir="prev" color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainBtn} onPress={togglePlay} activeOpacity={0.85}>
              {playing ? <PauseIcon size={26} /> : <PlayIcon size={28} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={next} hitSlop={12}>
              <SkipIcon size={30} dir="next" color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLoop}
              hitSlop={12}
              style={[styles.loopSlot, looping && styles.loopSlotActive]}
            >
              <LoopIcon size={18} active={looping} color={looping ? colors.black : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const SIDE = 40;

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  chevronDown: { transform: [{ rotate: '90deg' }] },
  topLabel: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  coverWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
    shadowColor: colors.black,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  meta: { flex: 1 },
  title: { color: colors.text, ...typography.display, fontSize: 24 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  sub: { color: colors.textMuted, ...typography.body },
  progressBlock: { marginTop: spacing.xxl },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  time: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
  },
  sideSlot: { width: SIDE, height: SIDE },
  mainBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopSlot: {
    width: SIDE,
    height: SIDE,
    borderRadius: SIDE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopSlotActive: { backgroundColor: colors.primary },
});
