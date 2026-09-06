import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, radius, typography, layout } from '../../theme';
import { DownloadIcon, FolderIcon } from '../../components/Icon';
import { useLibrary, ImportResult } from '../../library/LibraryContext';
import { useSettings } from '../../settings/SettingsContext';

/**
 * Aba de importação de músicas. Três fontes, todas offline depois de importar:
 *  - Baixar de um link (usa o seu servidor pessoal `server/`, opcional).
 *  - Escolher arquivos do dispositivo.
 *  - Escolher uma pasta do dispositivo (Android / SAF).
 */
export default function ImportTab() {
  const navigation = useNavigation<any>();
  const { importFiles, importFolder, importFromLink, downloads } = useLibrary();
  const { folder, downloadServerUrl, defaultFormat } = useSettings();
  const [busy, setBusy] = useState<null | 'files' | 'folder' | 'link'>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [link, setLink] = useState('');

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
      case 'noserver':
        return r.message ?? 'Servidor de download não configurado.';
      case 'error':
        return r.message ?? 'Não foi possível importar. Tente novamente.';
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

  const runLink = async () => {
    if (busy || !link.trim()) return;
    Keyboard.dismiss();
    setBusy('link');
    setStatus('Baixando… (pode demorar se o servidor estiver iniciando)');
    try {
      const res = await importFromLink(link.trim());
      setStatus(describe(res));
      if (res.ok) setLink('');
    } catch {
      setStatus('Não foi possível baixar. Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  const serverOn = !!downloadServerUrl.trim();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomInset }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.hero}>Importar músicas</Text>
      <Text style={styles.intro}>
        Adicione músicas do seu celular ou baixe de um link pelo seu servidor. Os arquivos e seus
        nomes ficam salvos e continuam disponíveis depois de fechar o app.
      </Text>

      {/* Baixar de um link */}
      <Text style={styles.sectionLabel}>Baixar de um link</Text>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Cole o link (YouTube, etc.)"
          placeholderTextColor={colors.textFaint}
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={runLink}
          editable={!busy}
        />
      </View>
      <TouchableOpacity
        style={[styles.cta, (busy === 'link' || !serverOn) && styles.ctaBusy]}
        onPress={serverOn ? runLink : () => navigation.navigate('Settings')}
        activeOpacity={0.85}
        disabled={busy === 'link'}
      >
        <DownloadIcon size={18} active color={colors.black} />
        <Text style={styles.ctaText}>
          {busy === 'link'
            ? 'Baixando…'
            : serverOn
            ? `Baixar (${defaultFormat === 'MP3' ? 'MP3' : 'M4A'})`
            : 'Configurar servidor'}
        </Text>
      </TouchableOpacity>
      {!serverOn && (
        <Text style={styles.hint}>
          Para baixar de link, configure o endereço do seu servidor em Configurações → Servidor de
          download. Veja a pasta <Text style={styles.mono}>server/</Text> do projeto.
        </Text>
      )}

      {/* Do dispositivo */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>Do dispositivo</Text>
      <TouchableOpacity
        style={[styles.ctaOutline, busy === 'files' && styles.ctaBusy]}
        onPress={() => run('files')}
        activeOpacity={0.85}
        disabled={!!busy}
      >
        <DownloadIcon size={18} color={colors.primary} />
        <Text style={styles.ctaOutlineText}>
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
        <Text style={styles.infoLineMuted}>Formatos aceitos: MP3, M4A, WAV, AAC, OGG, OPUS, FLAC.</Text>
        {Platform.OS === 'android' && (
          <Text style={styles.infoLineFaint}>
            Ao escolher uma pasta, o Android guarda a permissão de acesso — as músicas continuam
            disponíveis nas próximas vezes que você abrir o app.
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
  sectionLabel: {
    color: colors.textFaint,
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
  hint: {
    color: colors.textFaint,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
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
