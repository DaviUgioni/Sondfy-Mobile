/** Utilidades de cor para os degradês derivados da capa. */

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Escurece uma cor hex por um fator 0..1. */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  const to2 = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0');
  return `#${to2(r * f)}${to2(g * f)}${to2(b * f)}`;
}
