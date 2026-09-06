import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, layout } from '../../theme';
import { useLibrary } from '../../library/LibraryContext';
import { formatLongDuration } from '../../utils/time';
import { ClockIcon, RepeatIcon, DownloadIcon } from '../../components/Icon';

export default function StatsTab() {
  const { stats } = useLibrary();
  const hasData = stats.downloadCount > 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomInset }}
    >
      <Text style={styles.title}>Estatísticas</Text>

      {/* 1 — Tempo total de música ouvido (card verde de destaque) */}
      <View style={[styles.card, styles.cardGreen]}>
        <View style={styles.cardHead}>
          <ClockIcon size={20} color={colors.black} />
          <Text style={[styles.cardLabel, styles.cardLabelOnGreen]}>Tempo total ouvido</Text>
        </View>
        <Text style={[styles.metricBig, styles.metricOnGreen]}>
          {formatLongDuration(stats.totalListenedSec)}
        </Text>
      </View>

      {/* 2 — Música mais repetida (card preto) */}
      <View style={[styles.card, styles.cardDark]}>
        <View style={styles.cardHead}>
          <RepeatIcon size={20} mode="all" color={colors.primary} />
          <Text style={styles.cardLabel}>Música mais repetida</Text>
        </View>
        {stats.mostPlayed ? (
          <>
            <Text style={styles.metricMed} numberOfLines={2}>
              {stats.mostPlayed.title}
            </Text>
            <Text style={styles.metricHint}>
              {stats.mostPlayed.playCount}{' '}
              {stats.mostPlayed.playCount === 1 ? 'reprodução' : 'reproduções'}
            </Text>
          </>
        ) : (
          <Text style={styles.metricEmpty}>Nenhuma reprodução ainda</Text>
        )}
      </View>

      {/* 3 — Quantidade de músicas baixadas (card preto com número verde) */}
      <View style={[styles.card, styles.cardDark]}>
        <View style={styles.cardHead}>
          <DownloadIcon size={20} active color={colors.primary} />
          <Text style={styles.cardLabel}>Músicas baixadas no dispositivo</Text>
        </View>
        <Text style={[styles.metricBig, { color: colors.primary }]}>{stats.downloadCount}</Text>
      </View>

      {!hasData && (
        <Text style={styles.footnote}>
          Os números aparecem conforme você baixa e ouve músicas.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.display,
    fontSize: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    padding: spacing.xl,
  },
  cardGreen: { backgroundColor: colors.primary },
  cardDark: { backgroundColor: '#000000', borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardLabel: { color: colors.textMuted, ...typography.caption, fontSize: 13, fontWeight: '600' },
  cardLabelOnGreen: { color: colors.black, opacity: 0.7 },
  metricBig: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  metricOnGreen: { color: colors.black },
  metricMed: { color: colors.text, fontSize: 20, fontWeight: '700' },
  metricHint: { color: colors.primary, ...typography.caption, marginTop: spacing.xs },
  metricEmpty: { color: colors.textFaint, ...typography.body },
  footnote: {
    color: colors.textFaint,
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
});
