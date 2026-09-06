import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

import { colors, spacing, radius, typography } from '../theme';
import type { DownloadedTrack } from '../library/LibraryContext';

type Props = {
  track: DownloadedTrack | null;
  onClose: () => void;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string) => void;
};

/** Modal simples para renomear ou remover uma faixa da biblioteca. */
export default function TrackEditModal({ track, onClose, onRename, onRemove }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(track?.title ?? '');
  }, [track]);

  if (!track) return null;

  const save = () => {
    const clean = name.trim();
    if (clean && clean !== track.title) onRename(track.id, clean);
    onClose();
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remover da biblioteca',
      `Remover "${track.title}"?` +
        (track.origin === 'folder'
          ? '\n\nO arquivo original na sua pasta não é apagado.'
          : '\n\nA cópia guardada pelo app é apagada.'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            onRemove(track.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.title}>Editar faixa</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome da faixa"
            placeholderTextColor={colors.textFaint}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={save}
          />

          {!!track.fileName && (
            <Text style={styles.meta} numberOfLines={1}>
              Arquivo: {track.fileName}
            </Text>
          )}
          <Text style={styles.meta} numberOfLines={1}>
            Origem: {track.folderPath}
            {track.missing ? ' · indisponível' : ''}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={confirmRemove} style={styles.removeBtn} activeOpacity={0.7}>
              <Text style={styles.removeText}>Remover</Text>
            </TouchableOpacity>
            <View style={styles.rightBtns}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} style={styles.saveBtn} activeOpacity={0.85}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { color: colors.text, ...typography.section, marginBottom: spacing.sm },
  label: {
    color: colors.textFaint,
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.thumb,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  meta: { color: colors.textFaint, ...typography.caption, fontSize: 11 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  rightBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeBtn: { paddingVertical: spacing.sm, paddingRight: spacing.sm },
  removeText: { color: '#E24A4A', ...typography.pill },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelText: { color: colors.textMuted, ...typography.pill },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  saveText: { color: colors.black, ...typography.pill },
});
