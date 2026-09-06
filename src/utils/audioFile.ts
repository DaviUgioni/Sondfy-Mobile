/**
 * Utilitários para identificar arquivos de áudio locais e extrair o nome real
 * da faixa a partir do URI/nome retornado pelo seletor de arquivos ou pelo SAF.
 *
 * Regras:
 * - Nunca adiciona extensão artificialmente ao nome.
 * - O nome exibido é derivado do nome real do arquivo importado.
 */

/** Extensões de áudio que o app reconhece (Android/iOS via ExoPlayer/AVPlayer). */
export const AUDIO_EXTENSIONS = [
  'mp3',
  'm4a',
  'wav',
  'aac',
  'ogg',
  'oga',
  'opus',
  'flac',
] as const;

export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];

/** Rótulo curto de formato mostrado no player e nas listas. */
const FORMAT_LABELS: Record<string, string> = {
  mp3: 'MP3',
  m4a: 'M4A',
  wav: 'WAV',
  aac: 'AAC',
  ogg: 'OGG',
  oga: 'OGG',
  opus: 'OPUS',
  flac: 'FLAC',
};

/**
 * Decodifica um URI (`file://`, `content://`, SAF) e devolve só o último
 * segmento — o nome do arquivo com extensão.
 * Ex.: `content://.../document/primary%3AMusic%2FMinha%20Faixa.mp3` -> `Minha Faixa.mp3`
 */
export function fileNameFromUri(uri: string): string {
  if (!uri) return '';
  let decoded = uri;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    // URI já decodificado ou malformado — segue com o original.
  }
  // Remove query/hash e normaliza separadores (SAF usa ":" e "/").
  const clean = decoded.split(/[?#]/)[0];
  const parts = clean.split(/[/\\:]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : clean;
}

/** Extensão em minúsculas, sem ponto. Vazia se não houver. */
export function extensionOf(uriOrName: string): string {
  const name = uriOrName.includes('/') || uriOrName.includes('%')
    ? fileNameFromUri(uriOrName)
    : uriOrName;
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** true se o arquivo tem extensão de áudio suportada. */
export function isAudioFile(uriOrName: string): boolean {
  return (AUDIO_EXTENSIONS as readonly string[]).includes(extensionOf(uriOrName));
}

/** Rótulo de formato ('MP3', 'M4A'...) a partir do URI/nome. Fallback: extensão em maiúsculas ou '?'. */
export function formatLabel(uriOrName: string): string {
  const ext = extensionOf(uriOrName);
  return FORMAT_LABELS[ext] ?? (ext ? ext.toUpperCase() : '?');
}

/**
 * Nome de exibição da faixa: nome real do arquivo sem a extensão.
 * Preserva o texto original (não troca "_" por espaço, não recapitaliza) para
 * bater exatamente com o arquivo importado.
 */
export function displayTitleFromFileName(fileNameOrUri: string, fallback = 'Faixa sem nome'): string {
  const name = fileNameFromUri(fileNameOrUri) || fileNameOrUri;
  if (!name) return fallback;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const trimmed = base.trim();
  return trimmed.length ? trimmed : fallback;
}

/** Nome de arquivo seguro para gravar no diretório do app (mantém a extensão original). */
export function safeFileName(fileNameOrUri: string): string {
  const name = fileNameFromUri(fileNameOrUri) || 'faixa';
  // Remove caracteres problemáticos em sistemas de arquivos, preserva a extensão.
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'faixa';
}
