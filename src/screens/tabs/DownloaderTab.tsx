import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, typography, layout } from '../../theme';
import { DownloadIcon } from '../../components/Icon';
import { useLibrary } from '../../library/LibraryContext';
import { useSettings } from '../../settings/SettingsContext';
import { parseYouTubeId, youTubeThumbnail } from '../../utils/youtube';
import { formatTime } from '../../utils/time';

type JobStatus = 'processing' | 'downloading' | 'success' | 'error';
type Job = {
  id: string;
  url: string;
  videoId: string | null;
  status: JobStatus;
  percent: number;
  durationSec: number;
};

export default function DownloaderTab() {
  const { addDownload } = useLibrary();
  const { folder, defaultFormat } = useSettings();
  const [url, setUrl] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
    },
    []
  );

  const startDownload = () => {
    const raw = url.trim();
    if (!raw) return;
    Keyboard.dismiss();
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    const videoId = parseYouTubeId(raw);
    const id = String(Date.now());

    if (!videoId) {
      setJob({ id, url: raw, videoId: null, status: 'error', percent: 0, durationSec: 0 });
      return;
    }

    setJob({ id, url: raw, videoId, status: 'processing', percent: 0, durationSec: 0 });
    setUrl('');

    // Passo 1: resolver o vídeo (o que um backend yt-dlp retornaria).
    const t1 = setTimeout(() => {
      const durationSec = 120 + Math.floor(Math.random() * 300);
      setJob((j) => (j && j.id === id ? { ...j, status: 'downloading', durationSec } : j));

      // Passo 2: progresso do download até o dispositivo.
      let percent = 0;
      const iv = setInterval(() => {
        percent = Math.min(100, percent + 6 + Math.random() * 10);
        if (percent >= 100) {
          clearInterval(iv);
          setJob((j) => (j && j.id === id ? { ...j, percent: 100, status: 'success' } : j));
          addDownload({
            id,
            title: `Vídeo ${videoId}`,
            sourceUrl: raw,
            thumbnailUrl: youTubeThumbnail(videoId),
            folderPath: folder.path,
            durationSec,
            format: defaultFormat,
            sizeMB: (durationSec / 60) * (defaultFormat === 'FLAC' ? 5.2 : 1.1),
          });
        } else {
          setJob((j) => (j && j.id === id ? { ...j, percent } : j));
        }
      }, 300);
      timers.current.push(iv as unknown as ReturnType<typeof setTimeout>);
    }, 1000);
    timers.current.push(t1);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomInset }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.hero}>Downloader</Text>

      {/* Campo para link do YouTube */}
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Cole o link do YouTube"
          placeholderTextColor={colors.textFaint}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onSubmitEditing={startDownload}
          returnKeyType="go"
        />
      </View>

      {/* Botão de baixar */}
      <TouchableOpacity style={styles.cta} onPress={startDownload} activeOpacity={0.85}>
        <DownloadIcon size={18} active color={colors.black} />
        <Text style={styles.ctaText}>Baixar</Text>
      </TouchableOpacity>

      {/* Barra de progresso */}
      {job && <ProgressCard job={job} />}
    </ScrollView>
  );
}

function ProgressCard({ job }: { job: Job }) {
  const error = job.status === 'error';
  const done = job.status === 'success';
  const pct = error ? 0 : done ? 100 : job.percent;

  const statusText = error
    ? 'Link inválido'
    : job.status === 'processing'
    ? 'Processando link…'
    : done
    ? `Concluído · ${formatTime(job.durationSec)}`
    : `Baixando… ${Math.round(job.percent)}%`;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel} numberOfLines={1}>
          {job.videoId ? `Vídeo ${job.videoId}` : job.url}
        </Text>
        <Text
          style={[
            styles.progressPct,
            done && { color: colors.primary },
            error && { color: '#E24A4A' },
          ]}
        >
          {statusText}
        </Text>
      </View>

      {!error && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    color: colors.text,
    ...typography.display,
    fontSize: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  field: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.thumb,
    paddingHorizontal: spacing.lg,
    height: 50,
    justifyContent: 'center',
  },
  input: { color: colors.text, ...typography.body, paddingVertical: 0 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ctaText: { color: colors.black, ...typography.pill, fontSize: 15 },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  progressLabel: { color: colors.text, ...typography.body, flexShrink: 1 },
  progressPct: { color: colors.textMuted, ...typography.caption, fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
});
