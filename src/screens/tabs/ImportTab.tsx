import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';

import { colors, spacing, radius, typography, layout } from '../../theme';
import { DownloadIcon, FolderIcon } from '../../components/Icon';
import { useLibrary, ImportResult } from '../../library/LibraryContext';
import { useSettings } from '../../settings/SettingsContext';

/**
 * Aba de importação de músicas locais (substitui o antigo Downloader simulado).
 * Duas ações reais e gratuitas: escolher arquivos ou escolher uma pasta do
 * dispositivo. Tudo offline, sem servidor.
 */
export default function ImportTab() {
  const { importFiles, importFolder, downloads } = useLibrary();
  const { folder } = useSettings();
  const [busy, setBusy] = useState<null | 'files' | 'folder'>(null);
  const [status, setStatus] = useState<string | null>(null);

  const describe = (r: ImportResult): string => {
    if (r.ok) {
      if (r.added === 0) return `Nada novo — ${r.duplicates} já estava(m) na biblioteca.`;
      const dup = r.duplicates ? ` (${r.duplicates} já existia(m))` : '';
      return `${r.added} música(s) adicionada(s)${dup}.`;
    }
    switch (r.reason) {
      case 'cancel':
        return 'Seleção cancelada.';
      case 'denied':
        return 'Permissão da pasta não concedida.';
      case 'empty':
        return 'Nenhum arquivo de áudio compatível nessa pasta.';
      default:
        return 'Não foi possível importar. Tente novamente.';
    }
  };

  const run = async (kind: 'files' | 'folder') => {
    if (busy) return;
    setBusy(kind);
    setStatus('Importando…');
    try {
      const res = kind === 'files' ? await importFiles() : await importFolder();
      setStatus(describe(res));
    } catch {
      setStatus('Não foi possível importar. Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomInset }}
    >
      <Text style={styles.hero}>Importar músicas</Text>
      <Text style={styles.intro}>
        Adicione músicas que já estão no seu celular. Os arquivos e seus nomes ficam salvos e
        continuam disponíveis depois de fechar o app.
      </Text>

      <TouchableOpacity
        style={[styles.cta, busy === 'files' && styles.ctaBusy]}
        onPress={() => run('files')}
        activeOpacity={0.85}
        disabled={!!busy}
      >
        <DownloadIcon size={18} active color={colors.black} />
        <Text style={styles.ctaText}>
          {busy === 'files' ? 'Abrindo…' : 'Escolher arquivos'}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && (
        <TouchableOpacity
          style={[styles.ctaOutline, busy === 'folder' && styles.ctaBusy]}
          onPress={() => run('folder')}
          activeOpacity={0.85}
          disabled={!!busy}
        >
          <FolderIcon size={18} color={colors.primary} />
          <Text style={styles.ctaOutlineText}>
            {busy === 'folder' ? 'Abrindo…' : 'Escolher pasta do dispositivo'}
          </Text>
        </TouchableOpacity>
      )}

      {status && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoLine}>
          Biblioteca: {downloads.length} {downloads.length === 1 ? 'música' : 'músicas'}
        </Text>
        {folder && (
          <Text style={styles.infoLineMuted} numberOfLines={1}>
            Pasta atual: {folder.label}
          </Text>
        )}
        <Text style={styles.infoLineMuted}>
          Formatos aceitos: MP3, M4A, WAV, AAC, OGG, OPUS, FLAC.
        </Text>
        {Platform.OS === 'android' && (
          <Text style={styles.infoLineFaint}>
            Ao escolher uma pasta, o Android guarda a permissão de acesso — as músicas
            continuam disponíveis nas próximas vezes que você abrir o app.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    color: colors.text,
    ...typography.display,
    fontSize: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  intro: {
    color: colors.textMuted,
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ctaBusy: { opacity: 0.6 },
  ctaText: { color: colors.black, ...typography.pill, fontSize: 15 },
  ctaOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ctaOutlineText: { color: colors.primary, ...typography.pill, fontSize: 15 },
  statusCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.card,
  },
  statusText: { color: colors.text, ...typography.body },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    gap: spacing.sm,
  },
  infoLine: { color: colors.text, ...typography.body },
  infoLineMuted: { color: colors.textMuted, ...typography.caption, fontSize: 12, lineHeight: 18 },
  infoLineFaint: { color: colors.textFaint, ...typography.caption, fontSize: 11, lineHeight: 17 },
});
