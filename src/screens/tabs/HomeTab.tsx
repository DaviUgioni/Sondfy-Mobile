import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import CoverArt from '../../components/CoverArt';
import QualityTag from '../../components/QualityTag';
import EqualizerBars from '../../components/EqualizerBars';
import EmptyState from '../../components/EmptyState';
import { DownloadedBadge, GearIcon, PlayIcon, FolderIcon } from '../../components/Icon';
import { useLibrary } from '../../library/LibraryContext';
import { usePlayer } from '../../player/PlayerContext';
import { useSettings } from '../../settings/SettingsContext';
import { formatTime } from '../../utils/time';

type Props = {
  onOpenDownloader: () => void;
  onOpenSettings: () => void;
};

export default function HomeTab({ onOpenDownloader, onOpenSettings }: Props) {
  const { downloads } = useLibrary();
  const { track: current, playing, playTrack } = usePlayer();
  const { folder } = useSettings();
  const listRef = useRef<ScrollView>(null);

  // Mais recente sempre no topo.
  const ordered = useMemo(
    () => [...downloads].sort((a, b) => b.addedAt - a.addedAt),
    [downloads]
  );

  // Ao concluir um novo download, volta ao topo para o usuário ouvir na hora.
  const newestId = ordered[0]?.id;
  useEffect(() => {
    if (newestId) listRef.current?.scrollTo({ y: 0, animated: true });
  }, [newestId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Suas músicas</Text>
          <View style={styles.folderRow}>
            <FolderIcon size={13} color={colors.textMuted} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {folder.label}
              {'  ·  '}
              {downloads.length === 0
                ? 'nenhuma música'
                : `${downloads.length} ${downloads.length === 1 ? 'música' : 'músicas'}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onOpenSettings} hitSlop={8} style={styles.gear}>
          <GearIcon size={22} />
        </TouchableOpacity>
      </View>

      {ordered.length === 0 ? (
        <EmptyState
          title="Nenhuma música no dispositivo"
          message={`Nada em ${folder.label} ainda. Cole um link do YouTube na aba Downloader para baixar sua primeira música.`}
          actionLabel="Abrir Downloader"
          onAction={onOpenDownloader}
        />
      ) : (
        <ScrollView
          ref={listRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: layout.scrollBottomInset, paddingTop: spacing.sm }}
        >
          {ordered.map((t) => {
            const isCurrent = current?.id === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => playTrack(t)}
              >
                <CoverArt uri={t.thumbnailUrl} size={52} />
                <View style={styles.info}>
                  <View style={styles.titleLine}>
                    <DownloadedBadge size={13} />
                    <Text
                      style={[styles.rowTitle, isCurrent && { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                  </View>
                  <View style={styles.metaLine}>
                    <Text style={styles.meta}>{formatTime(t.durationSec)}</Text>
                    <QualityTag value={t.format} />
                    <Text style={styles.meta}>{t.sizeMB.toFixed(1)} MB</Text>
                  </View>
                </View>
                {isCurrent ? (
                  <EqualizerBars playing={playing} size={16} />
                ) : (
                  <View style={styles.playHint}>
                    <PlayIcon size={12} color={colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: { color: colors.text, ...typography.display, fontSize: 24 },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  subtitle: { color: colors.textMuted, ...typography.caption, flexShrink: 1 },
  gear: { padding: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: { flex: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { color: colors.text, ...typography.body, flexShrink: 1 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  meta: { color: colors.textMuted, ...typography.caption },
  playHint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
