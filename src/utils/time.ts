/** Converte "4:12" ou "1:02:11" em segundos. */
export function parseDuration(text: string): number {
  const parts = text.split(':').map((p) => parseInt(p, 10) || 0);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Formata uma duração longa de forma legível: "2 h 14 min", "8 min", "0 min". */
export function formatLongDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

/** Formata segundos em "m:ss" ou "h:mm:ss". */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
