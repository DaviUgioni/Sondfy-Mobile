import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, radius, typography } from '../theme';
import GradientBackground from '../components/GradientBackground';
import { ChevronRight, CheckIcon, FolderIcon } from '../components/Icon';
import { DEVICE_FOLDERS, useSettings } from '../settings/SettingsContext';

export default function FolderPickerScreen() {
  const navigation = useNavigation();
  const { folder, setFolder } = useSettings();

  return (
    <GradientBackground tint={colors.bgGradientTop}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <ChevronRight size={16} color={colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Pasta no dispositivo</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Escolha a pasta do celular que o Sondfy usa. Novos downloads são salvos nela e o
            conteúdo dela aparece na tela Suas músicas.
          </Text>

          <View style={styles.card}>
            {DEVICE_FOLDERS.map((f, i) => {
              const selected = f.id === folder.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFolder(f);
                    navigation.goBack();
                  }}
                >
                  <FolderIcon size={20} active={selected} color={selected ? colors.primary : colors.textMuted} />
                  <View style={styles.rowText}>
                    <Text style={[styles.folderName, selected && { color: colors.primary }]}>
                      {f.label}
                    </Text>
                    <Text style={styles.folderPath} numberOfLines={1}>
                      {f.path}
                    </Text>
                  </View>
                  {selected && (
                    <View style={styles.check}>
                      <CheckIcon size={14} color={colors.black} thickness={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.note}>
            O Sondfy pede permissão de acesso ao armazenamento na primeira vez que você abre uma
            pasta.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
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
  title: { color: colors.text, ...typography.section },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  intro: {
    color: colors.textMuted,
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 60,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowText: { flex: 1 },
  folderName: { color: colors.text, ...typography.body },
  folderPath: { color: colors.textFaint, ...typography.caption, fontSize: 11, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    color: colors.textFaint,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
