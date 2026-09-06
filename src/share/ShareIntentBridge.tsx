import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useShareIntentContext } from 'expo-share-intent';

import { useLibrary } from '../library/LibraryContext';

/**
 * Ponte do "Compartilhar" do sistema para a biblioteca.
 *
 * Quando o usuário compartilha um arquivo de áudio de outro app (ex.: NewPipe)
 * para o Sondfy, o arquivo chega aqui via expo-share-intent. Nós copiamos para o
 * app e adicionamos à biblioteca. Renderiza `null` — é só lógica.
 */
export default function ShareIntentBridge() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const { importSharedFiles } = useLibrary();
  const handling = useRef(false);

  useEffect(() => {
    if (error) console.warn('[share-intent]', error);
  }, [error]);

  useEffect(() => {
    if (!hasShareIntent || handling.current) return;

    const files = (shareIntent?.files ?? []).map((f) => ({
      path: f.path,
      fileName: f.fileName,
      mimeType: f.mimeType,
    }));

    if (files.length === 0) {
      resetShareIntent();
      return;
    }

    handling.current = true;
    (async () => {
      try {
        const res = await importSharedFiles(files);
        if (res.ok) {
          Alert.alert('Sondfy', `${res.added} música(s) adicionada(s) à biblioteca.`);
        } else if (res.reason === 'empty') {
          Alert.alert('Sondfy', 'O arquivo compartilhado não é um áudio compatível.');
        } else {
          Alert.alert('Sondfy', 'Não foi possível importar o arquivo compartilhado.');
        }
      } catch (err) {
        console.warn('[share-intent] import falhou:', err);
        Alert.alert('Sondfy', 'Não foi possível importar o arquivo compartilhado.');
      } finally {
        resetShareIntent();
        handling.current = false;
      }
    })();
  }, [hasShareIntent, shareIntent, importSharedFiles, resetShareIntent]);

  return null;
}
