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

export type ImportOrigin = 'file' | 'folder' | 'youtube';

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
  /** Tamanho exato em bytes (0 quando desconhecido) — usado para detectar duplicatas. */
  sizeBytes: number;
  /** Chave de conteúdo: mesmo arquivo importado de novo => mesma chave. */
  dedupKey: string;
  origin: ImportOrigin;
  /** Pasta de origem (rótulo legível) — só informativo. */
  folderPath: string;
  /** Duração em segundos, quando a origem já informa (ex.: download por link). */
  durationSec?: number;
};

/** Diretório do app onde ficam as cópias dos arquivos avulsos importados. */
const MUSIC_DIR = `${FileSystem.documentDirectory ?? ''}music/`;

/** Chave de deduplicação por conteúdo: nome real do arquivo + tamanho em bytes. */
export function makeDedupKey(fileName: string, sizeBytes: number): string {
  return `${(fileName || '').trim().toLowerCase()}|${sizeBytes || 0}`;
}

/** true se o URI aponta para uma cópia dentro do app (seguro apagar ao remover a faixa). */
export function isAppOwnedUri(uri: string): boolean {
  return !!uri && !!FileSystem.documentDirectory && uri.startsWith(FileSystem.documentDirectory);
}

/** Apaga um arquivo que é cópia do app. Não faz nada para URIs externos (SAF). */
export async function deleteAppFile(uri: string): Promise<void> {
  if (!isAppOwnedUri(uri)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (err) {
    console.warn('[import] não consegui apagar a cópia:', err);
  }
}

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

/** Tamanho em bytes de um URI (0 se não der para saber). */
async function fileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && info.size ? info.size : 0;
  } catch {
    return 0;
  }
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

    const sizeBytes = asset.size && asset.size > 0 ? asset.size : await fileSize(finalUri);

    out.push({
      uri: finalUri,
      title: displayTitleFromFileName(fileName),
      fileName,
      format: formatLabel(fileName),
      sizeMB: toMB(sizeBytes),
      sizeBytes,
      dedupKey: makeDedupKey(fileName, sizeBytes),
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
    const sizeBytes = await fileSize(uri);
    tracks.push({
      uri,
      title: displayTitleFromFileName(fileName),
      fileName,
      format: formatLabel(fileName),
      sizeMB: toMB(sizeBytes),
      sizeBytes,
      dedupKey: makeDedupKey(fileName, sizeBytes),
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

export type DownloadFormat = 'm4a' | 'mp3';

/**
 * Baixa o áudio de um link (YouTube etc.) através do SEU servidor pessoal
 * (pasta `server/` deste repo). O servidor usa yt-dlp; o app só faz um GET e
 * salva o arquivo no diretório do app. Depois disso é 100% offline.
 *
 * Lança Error com mensagem legível em qualquer falha (sem servidor configurado,
 * link inválido, vídeo indisponível, servidor fora do ar...).
 */
export async function downloadFromServer(opts: {
  serverUrl: string;
  apiKey: string;
  videoUrl: string;
  format: DownloadFormat;
}): Promise<LocalTrackInput> {
  const base = opts.serverUrl.trim().replace(/\/+$/, '');
  if (!base) throw new Error('Servidor de download não configurado (veja Configurações).');
  if (!/^https?:\/\/.+/i.test(base)) throw new Error('URL do servidor inválida.');
  if (!/^https?:\/\/\S+$/i.test(opts.videoUrl.trim())) throw new Error('Cole um link válido (http/https).');

  await ensureMusicDir();

  const qs =
    `url=${encodeURIComponent(opts.videoUrl.trim())}` +
    `&format=${opts.format}` +
    (opts.apiKey ? `&key=${encodeURIComponent(opts.apiKey)}` : '');
  const endpoint = `${base}/download?${qs}`;
  const tmp = `${MUSIC_DIR}dl_${Date.now()}.${opts.format}`;

  let res;
  try {
    res = await FileSystem.downloadAsync(endpoint, tmp);
  } catch (err: any) {
    throw new Error(
      `Não foi possível falar com o servidor. Ele pode estar iniciando (plano free "dorme") — tente de novo em 1 min. [${err?.message ?? err}]`
    );
  }

  if (res.status !== 200) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await FileSystem.readAsStringAsync(tmp);
      const parsed = JSON.parse(body);
      detail = parsed.error + (parsed.detail ? ` — ${parsed.detail}` : '');
    } catch {
      /* corpo não era JSON */
    }
    await FileSystem.deleteAsync(tmp, { idempotent: true });
    throw new Error(detail);
  }

  const headers: Record<string, string> = (res.headers as any) ?? {};
  const rawTitle = headers['x-video-title'] ?? headers['X-Video-Title'] ?? '';
  const title = rawTitle
    ? safeDecode(rawTitle)
    : displayTitleFromFileName(tmp, 'Faixa baixada');
  const durationSec =
    Number(headers['x-video-duration'] ?? headers['X-Video-Duration'] ?? 0) || 0;

  const fileName = `${safeFileName(title)}.${opts.format}`;
  const dest = await uniqueDestination(fileName);
  try {
    await FileSystem.moveAsync({ from: tmp, to: dest });
  } catch {
    // se o move falhar, seguimos com o arquivo temporário mesmo.
  }
  const finalUri = (await FileSystem.getInfoAsync(dest)).exists ? dest : tmp;
  const sizeBytes = await fileSize(finalUri);

  return {
    uri: finalUri,
    title,
    fileName,
    format: formatLabel(fileName),
    sizeMB: toMB(sizeBytes),
    sizeBytes,
    dedupKey: makeDedupKey(fileName, sizeBytes),
    origin: 'youtube',
    folderPath: 'Baixadas',
    durationSec,
  };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Arquivo recebido pelo "Compartilhar" do sistema (ex.: vindo do NewPipe). */
export type SharedFile = { path: string; fileName?: string | null; mimeType?: string | null };

/**
 * Importa arquivos de áudio recebidos via "Compartilhar". Cada arquivo é
 * copiado para o diretório do app (o URI compartilhado é temporário).
 */
export async function copySharedFilesToLibrary(files: SharedFile[]): Promise<LocalTrackInput[]> {
  const audio = files.filter(
    (f) => (f.mimeType?.startsWith('audio/') ?? false) || isAudioFile(f.fileName || f.path)
  );
  if (audio.length === 0) return [];

  await ensureMusicDir();

  const out: LocalTrackInput[] = [];
  for (const f of audio) {
    const name = f.fileName && isAudioFile(f.fileName) ? f.fileName : fileNameFromUri(f.path);
    if (!isAudioFile(name)) continue;

    let finalUri = f.path;
    try {
      const dest = await uniqueDestination(name);
      await FileSystem.copyAsync({ from: f.path, to: dest });
      finalUri = dest;
    } catch (err) {
      console.warn('[share] falha ao copiar; usando URI original:', name, err);
    }

    const sizeBytes = await fileSize(finalUri);

    out.push({
      uri: finalUri,
      title: displayTitleFromFileName(name),
      fileName: name,
      format: formatLabel(name),
      sizeMB: toMB(sizeBytes),
      sizeBytes,
      dedupKey: makeDedupKey(name, sizeBytes),
      origin: 'file',
      folderPath: 'Compartilhadas',
    });
  }
  return out;
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
