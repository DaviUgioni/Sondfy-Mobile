/**
 * Sondfy design tokens — estética baseada no Spotify.
 * Fundo quase preto, verde de destaque, tipografia sans-serif geométrica.
 */

export const colors = {
  /** Fundo predominante (quase preto). */
  bg: '#121212',
  /** Topo das telas — usado como tint do degradê descendente. */
  bgGradientTop: '#1F1F1F',
  /** Cards e módulos de conteúdo (levemente mais claro que o fundo). */
  card: '#181818',
  /** Card em estado de destaque / hover. */
  cardElevated: '#242424',
  /** Superfície de inputs e thumbnails vazias. */
  surface: '#2A2A2A',
  /** Placeholder de capa sem arte (nota musical sobre cinza). */
  placeholder: '#282828',
  /** Barra inferior translúcida. */
  bottomBar: 'rgba(18,18,18,0.96)',
  /** Mini player flutuante. */
  player: '#232323',

  /** Verde marcante — ações principais e estados ativos/selecionados. */
  primary: '#1DB954',
  primaryPressed: '#1AA34A',

  /** Texto e ícones principais. */
  text: '#FFFFFF',
  /** Texto secundário e ícones inativos. */
  textMuted: '#B3B3B3',
  /** Texto terciário / placeholders. */
  textFaint: '#727272',

  border: '#2A2A2A',
  /** Sobreposição usada nos degradês ao redor de conteúdo em destaque. */
  overlay: 'rgba(0,0,0,0.45)',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  /** Capas e thumbnails — cantos ligeiramente arredondados. */
  thumb: 4,
  sm: 6,
  /** Cards e módulos. */
  card: 8,
  pill: 999,
  round: 9999,
} as const;

export const typography = {
  family: undefined as string | undefined, // sistema (San Francisco / Roboto) — sans-serif geométrica
  display: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  /** Títulos de seção — negrito e grandes. */
  section: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  cardTitle: { fontSize: 14, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  /** Descrições pequenas em tom cinza. */
  caption: { fontSize: 12, fontWeight: '500' as const },
  pill: { fontSize: 13, fontWeight: '600' as const },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  bottomBarHeight: 58,
  miniPlayerHeight: 58,
  /** Espaço reservado no fim das listas (mini player + bottom bar + folga). */
  scrollBottomInset: 58 + 58 + 24,
} as const;
