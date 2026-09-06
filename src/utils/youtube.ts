/** Extrai o id do vídeo de um link do YouTube. Retorna null se não reconhecer. */
export function parseYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export function isProbablyYouTubeUrl(url: string): boolean {
  return /youtu\.?be/i.test(url.trim());
}

/** URL pública da capa (thumbnail) do vídeo. */
export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
