/**
 * Importação de músicas locais do dispositivo.
 *
 * Duas portas de entrada, ambas 100% offline e sem servidor:
 *  1. `pickAudioFiles()`  — seletor de arquivos do SO (expo-document-picker).
 *     Os arquivos escolhidos são COPIADOS para o diretório do app, garantindo
 *     acesso permanente mesmo depois de reiniciar (o URI do content:// avulso
 *     perde a permissão no Android).
 *  2. `pickAudioFolder()` — seletor de pasta via Storage Access Framework
 *     (expo-file-system). O Android PERSISTE a permissão da árvore escolhida,
 *     então guardamos os URIs `content://` direto, sem copiar cada arquivo.
 *
 * Em ambos os casos: identificamos o formato pela extensão real, extraímos o
 * nome real do arquivo e devolvemos tudo pronto para a biblioteca salvar.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import {
  displayTitleFromFileName,
  fileNameFromUri,
  formatLabel,
  isAudioFile,
  safeFileName,
} from '../utils/audioFile';

export type ImportOrigin = 'file' | 'folder';

/** Dados de uma faixa local prontos para entrar na biblioteca. */
export type LocalTrackInput = {
  /** URI reproduzível: `file://` (cópia no app) ou `content://` (SAF). */
  uri: string;
  /** Nome real do arquivo, sem extensão. */
  title: string;
  /** Nome do arquivo com extensão (para exibir a origem). */
  fileName: string;
  /** Rótulo de formato: MP3 / M4A / WAV / AAC / OGG / OPUS / FLAC. */
  format: string;
  /** Tamanho em MB (0 quando o SO não informa). */
  sizeMB: number;
  origin: ImportOrigin;
  /** Pasta de origem (rótulo legível) — só informativo. */
  folderPath: string;
};

/** Diretório do app onde ficam as cópias dos arquivos avulsos importados. */
const MUSIC_DIR = `${FileSystem.documentDirectory ?? ''}music/`;

async function ensureMusicDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(MUSIC_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
    }
  } catch (err) {
    console.warn('[import] não foi possível criar a pasta de músicas do app:', err);
  }
}

/** Gera um caminho livre em MUSIC_DIR, evitando sobrescrever cópias já existentes. */
async function uniqueDestination(fileName: string): Promise<string> {
  const safe = safeFileName(fileName);
  const dot = safe.lastIndexOf('.');
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';
  let candidate = `${MUSIC_DIR}${safe}`;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while ((await FileSystem.getInfoAsync(candidate)).exists) {
    candidate = `${MUSIC_DIR}${base} (${n})${ext}`;
    n += 1;
  }
  return candidate;
}

function toMB(bytes?: number): number {
  if (!bytes || bytes <= 0) return 0;
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

/**
 * Abre o seletor de arquivos do sistema (múltipla seleção, filtrado por áudio),
 * copia cada arquivo escolhido para o app e devolve as faixas normalizadas.
 * Retorna `[]` se o usuário cancelar.
 */
export async function pickAudioFiles(): Promise<LocalTrackInput[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return [];

  await ensureMusicDir();

  const out: LocalTrackInput[] = [];
  for (const asset of result.assets) {
    // Alguns provedores devolvem name sem extensão; o URI de cache preserva a real.
    const nameFromUri = fileNameFromUri(asset.uri);
    const fileName = isAudioFile(asset.name) ? asset.name : nameFromUri || asset.name;

    if (!isAudioFile(fileName)) {
      console.warn('[import] ignorado (não é áudio reconhecido):', fileName);
      continue;
    }

    let finalUri = asset.uri;
    try {
      const dest = await uniqueDestination(fileName);
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      finalUri = dest;
    } catch (err) {
      // Se a cópia falhar, ainda tentamos usar o URI original (cache).
      console.warn('[import] falha ao copiar; usando URI original:', fileName, err);
    }

    let sizeMB = toMB(asset.size);
    if (!sizeMB) {
      try {
        const info = await FileSystem.getInfoAsync(finalUri);
        if (info.exists && info.size) sizeMB = toMB(info.size);
      } catch {
        /* tamanho é opcional */
      }
    }

    out.push({
      uri: finalUri,
      title: displayTitleFromFileName(fileName),
      fileName,
      format: formatLabel(fileName),
      sizeMB,
      origin: 'file',
      folderPath: 'Arquivos importados',
    });
  }
  return out;
}

export type FolderImportResult = {
  tracks: LocalTrackInput[];
  folder: { uri: string; label: string };
  /** Total de arquivos de áudio encontrados na pasta (antes de deduplicar). */
  found: number;
};

/**
 * Abre o seletor de PASTA (Storage Access Framework, Android). Lê os arquivos
 * de áudio da pasta escolhida e devolve as faixas apontando para os `content://`
 * URIs — a permissão da árvore é persistida pelo Android entre reinícios.
 *
 * Retorna `null` se o usuário cancelar ou negar a permissão (ou em iOS/web,
 * onde SAF não existe — nesse caso o chamador deve usar `pickAudioFiles`).
 */
export async function pickAudioFolder(): Promise<FolderImportResult | null> {
  const SAF = FileSystem.StorageAccessFramework;
  if (!SAF?.requestDirectoryPermissionsAsync) return null;

  const perm = await SAF.requestDirectoryPermissionsAsync();
  if (!perm.granted || !perm.directoryUri) return null;

  const dirUri = perm.directoryUri;
  const entries = await SAF.readDirectoryAsync(dirUri);
  const audioUris = entries.filter((uri) => isAudioFile(uri));

  const tracks: LocalTrackInput[] = [];
  for (const uri of audioUris) {
    const fileName = fileNameFromUri(uri);
    let sizeMB = 0;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && info.size) sizeMB = toMB(info.size);
    } catch {
      /* tamanho é opcional para content:// */
    }
    tracks.push({
      uri,
      title: displayTitleFromFileName(fileName),
      fileName,
      format: formatLabel(fileName),
      sizeMB,
      origin: 'folder',
      folderPath: folderLabelFromUri(dirUri),
    });
  }

  return {
    tracks,
    folder: { uri: dirUri, label: folderLabelFromUri(dirUri) },
    found: audioUris.length,
  };
}

/** Rótulo legível para uma árvore SAF: `content://.../tree/primary%3AMusic%2FRock` -> `Rock`. */
export function folderLabelFromUri(treeUri: string): string {
  try {
    const decoded = decodeURIComponent(treeUri);
    const afterTree = decoded.split('/tree/')[1] ?? decoded;
    const tail = afterTree.split(/[:/]/).filter(Boolean).pop() ?? '';
    return tail || 'Pasta do dispositivo';
  } catch {
    return 'Pasta do dispositivo';
  }
}

/** Verifica se o arquivo/URI ainda está acessível (usado no boot e antes de tocar). */
export async function isUriAvailable(uri: string): Promise<boolean> {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    // getInfoAsync pode lançar para content:// cuja permissão foi revogada.
    return false;
  }
}
