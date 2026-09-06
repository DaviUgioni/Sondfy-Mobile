import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, radius, typography } from '../theme';
import GradientBackground from '../components/GradientBackground';
import { ChevronRight, FolderIcon, DownloadIcon } from '../components/Icon';
import { useSettings } from '../settings/SettingsContext';
import { useLibrary, ImportResult } from '../library/LibraryContext';

/**
 * Escolha real de pasta/arquivos do armazenamento do dispositivo.
 * Android: Storage Access Framework (permissão da árvore persistida pelo SO).
 * iOS: seletor de arquivos do sistema (permite navegar entre pastas).
 */
export default function FolderPickerScreen() {
  const navigation = useNavigation();
  const { folder } = useSettings();
  const { importFolder, importFiles, refreshAvailability, downloads } = useLibrary();
  const [busy, setBusy] = useState<null | 'folder' | 'files' | 'check'>(null);
  const [status, setStatus] = useState<string | null>(null);

  const describe = (r: ImportResult): string => {
    if (r.ok) {
      if (r.added === 0) return `Nada novo — ${r.duplicates} já estava(m) na biblioteca.`;
      return `${r.added} música(s) adicionada(s)${r.duplicates ? ` (${r.duplicates} repetida(s))` : ''}.`;
    }
    switch (r.reason) {
      case 'cancel':
        return 'Seleção cancelada.';
      case 'denied':
        return 'Permissão da pasta não concedida.';
      case 'empty':
        return 'Nenhum arquivo de áudio compatível nessa pasta.';
      default:
        return 'Não foi possível importar.';
    }
  };

  const run = async (kind: 'folder' | 'files') => {
    if (busy) return;
    setBusy(kind);
    setStatus('Abrindo o seletor…');
    try {
      const res = kind === 'folder' ? await importFolder() : await importFiles();
      setStatus(describe(res));
    } catch {
      setStatus('Não foi possível importar.');
    } finally {
      setBusy(null);
    }
  };

  const recheck = async () => {
    if (busy) return;
    setBusy('check');
    setStatus('Verificando arquivos…');
    try {
      await refreshAvailability();
      const missing = downloads.filter((d) => d.missing).length;
      setStatus(missing ? `${missing} arquivo(s) indisponível(is).` : 'Todos os arquivos estão acessíveis.');
    } finally {
      setBusy(null);
    }
  };

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
            Escolha uma pasta do seu celular com músicas, ou selecione arquivos avulsos. O Sondfy
            importa os áudios, guarda os nomes e mantém tudo disponível ao reabrir o app.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pasta atual</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {folder?.label ?? 'Nenhuma pasta escolhida'}
            </Text>
          </View>

          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[styles.action, busy === 'folder' && styles.actionBusy]}
              activeOpacity={0.85}
              onPress={() => run('folder')}
              disabled={!!busy}
            >
              <FolderIcon size={18} color={colors.primary} />
              <Text style={styles.actionText}>
                {busy === 'folder' ? 'Abrindo…' : 'Escolher pasta do dispositivo'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.action, busy === 'files' && styles.actionBusy]}
            activeOpacity={0.85}
            onPress={() => run('files')}
            disabled={!!busy}
          >
            <DownloadIcon size={18} active color={colors.primary} />
            <Text style={styles.actionText}>
              {busy === 'files' ? 'Abrindo…' : 'Escolher arquivos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, busy === 'check' && styles.actionBusy]}
            activeOpacity={0.85}
            onPress={recheck}
            disabled={!!busy}
          >
            <Text style={styles.actionText}>
              {busy === 'check' ? 'Verificando…' : 'Reverificar arquivos'}
            </Text>
          </TouchableOpacity>

          {status && <Text style={styles.status}>{status}</Text>}

          <Text style={styles.note}>
            {Platform.OS === 'android'
              ? 'Ao escolher uma pasta, o Android registra a permissão de acesso — as músicas continuam disponíveis nas próximas vezes. Arquivos avulsos são copiados para o app.'
              : 'Os arquivos escolhidos são copiados para o app, garantindo acesso mesmo depois de reiniciar.'}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  cardLabel: {
    color: colors.textFaint,
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardValue: { color: colors.text, ...typography.body },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionBusy: { opacity: 0.6 },
  actionText: { color: colors.primary, ...typography.pill, fontSize: 14 },
  status: {
    color: colors.text,
    ...typography.body,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  note: {
    color: colors.textFaint,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
