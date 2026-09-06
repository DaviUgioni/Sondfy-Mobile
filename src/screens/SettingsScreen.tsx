import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, typography } from '../theme';
import GradientBackground from '../components/GradientBackground';
import { ChevronRight, FolderIcon } from '../components/Icon';
import { AUDIO_FORMATS, useSettings } from '../settings/SettingsContext';

type RootStackParamList = { Main: undefined; Settings: undefined; FolderPicker: undefined };
type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { folder, defaultFormat, setDefaultFormat } = useSettings();

  return (
    <GradientBackground tint={colors.bgGradientTop}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <View style={styles.backChevron}>
              <ChevronRight size={16} color={colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Configurações</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Downloads">
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FolderPicker')}
            >
              <View style={styles.rowLeft}>
                <FolderIcon size={18} color={colors.textMuted} />
                <Text style={styles.rowLabel}>Pasta no dispositivo</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{folder.label}</Text>
                <ChevronRight />
              </View>
            </TouchableOpacity>

            <View style={[styles.row, styles.rowColumn]}>
              <Text style={styles.rowLabel}>Formato padrão do download</Text>
              <View style={styles.segment}>
                {AUDIO_FORMATS.map((f) => {
                  const active = f === defaultFormat;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.segmentItem, active && styles.segmentItemActive]}
                      onPress={() => setDefaultFormat(f)}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Section>

          <Section title="Sobre">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Versão</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backChevron: { transform: [{ rotate: '180deg' }] },
  title: { color: colors.text, ...typography.section },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    color: colors.textFaint,
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  rowColumn: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { color: colors.text, ...typography.body },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { color: colors.textMuted, ...typography.body },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, ...typography.caption, fontWeight: '700' },
  segmentTextActive: { color: colors.black },
});
