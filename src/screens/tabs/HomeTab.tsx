import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import CoverArt from '../../components/CoverArt';
import QualityTag from '../../components/QualityTag';
import EqualizerBars from '../../components/EqualizerBars';
import EmptyState from '../../components/EmptyState';
import TrackEditModal from '../../components/TrackEditModal';
import { DownloadedBadge, GearIcon, PlayIcon, FolderIcon, PlusIcon, MoreIcon } from '../../components/Icon';
import { useLibrary, DownloadedTrack } from '../../library/LibraryContext';
import { usePlayer } from '../../player/PlayerContext';
import { useSettings } from '../../settings/SettingsContext';
import { formatTime } from '../../utils/time';

type Props = {
  onOpenImport: () => void;
  onOpenSettings: () => void;
};

export default function HomeTab({ onOpenImport, onOpenSettings }: Props) {
  const { downloads, renameTrack, removeDownload } = useLibrary();
  const { track: current, playing, playTrack } = usePlayer();
  const { folder } = useSettings();
  const listRef = useRef<ScrollView>(null);
  const folderLabel = folder?.label ?? 'Dispositivo';
  const [editing, setEditing] = useState<DownloadedTrack | null>(null);

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
              {folderLabel}
              {'  ·  '}
              {downloads.length === 0
                ? 'nenhuma música'
                : `${downloads.length} ${downloads.length === 1 ? 'música' : 'músicas'}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onOpenImport} hitSlop={8} style={styles.gear}>
          <PlusIcon size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenSettings} hitSlop={8} style={styles.gear}>
          <GearIcon size={22} />
        </TouchableOpacity>
      </View>

      {ordered.length === 0 ? (
        <EmptyState
          title="Nenhuma música ainda"
          message="Importe músicas que já estão no seu celular: escolha arquivos ou uma pasta do dispositivo."
          actionLabel="Importar músicas"
          onAction={onOpenImport}
        />
      ) : (
        <ScrollView
          ref={listRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: layout.scrollBottomInset, paddingTop: spacing.sm }}
        >
          {ordered.map((t) => {
            const isCurrent = current?.id === t.id;
            const onPress = () => {
              if (t.missing) {
                Alert.alert(
                  'Arquivo indisponível',
                  `"${t.title}" foi movido ou removido do dispositivo. Reimporte o arquivo ou a pasta para ouvir de novo.`
                );
                return;
              }
              playTrack(t);
            };
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={onPress}
                onLongPress={() => setEditing(t)}
                delayLongPress={280}
              >
                <CoverArt uri={t.thumbnailUrl} size={52} />
                <View style={styles.info}>
                  <View style={styles.titleLine}>
                    {!t.missing && <DownloadedBadge size={13} />}
                    <Text
                      style={[
                        styles.rowTitle,
                        isCurrent && !t.missing && { color: colors.primary },
                        t.missing && { color: colors.textFaint },
                      ]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                  </View>
                  <View style={styles.metaLine}>
                    {t.missing ? (
                      <Text style={[styles.meta, { color: '#E24A4A' }]}>Indisponível</Text>
                    ) : (
                      <>
                        <Text style={styles.meta}>
                          {t.durationSec ? formatTime(t.durationSec) : '—'}
                        </Text>
                        <QualityTag value={t.format} />
                        {t.sizeMB > 0 && (
                          <Text style={styles.meta}>{t.sizeMB.toFixed(1)} MB</Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
                {t.missing ? (
                  <View style={styles.playHint}>
                    <Text style={{ color: colors.textFaint, fontSize: 14 }}>!</Text>
                  </View>
                ) : isCurrent ? (
                  <EqualizerBars playing={playing} size={16} />
                ) : (
                  <View style={styles.playHint}>
                    <PlayIcon size={12} color={colors.textMuted} />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setEditing(t)}
                  hitSlop={10}
                  style={styles.moreBtn}
                >
                  <MoreIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TrackEditModal
        track={editing}
        onClose={() => setEditing(null)}
        onRename={renameTrack}
        onRemove={removeDownload}
      />
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
  moreBtn: { paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
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
