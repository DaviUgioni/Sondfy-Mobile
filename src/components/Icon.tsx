import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

/**
 * Ícones minimalistas construídos apenas com Views (sem dependências).
 * Linhas finas quando inativos, preenchidos quando `active`.
 */

type IconProps = {
  size?: number;
  active?: boolean;
  color?: string;
};

const tintFor = (active?: boolean, color?: string) =>
  color ?? (active ? colors.text : colors.textMuted);

export const HomeIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.5,
          borderRightWidth: size * 0.5,
          borderBottomWidth: size * 0.42,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: tint,
        }}
      />
      <View
        style={{
          width: size * 0.66,
          height: size * 0.42,
          backgroundColor: active ? tint : 'transparent',
          borderWidth: active ? 0 : 2,
          borderTopWidth: 0,
          borderColor: tint,
        }}
      />
    </View>
  );
};

export const SearchIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  const d = size * 0.66;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          top: 1,
          left: 1,
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: active ? 3 : 2,
          borderColor: tint,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: size * 0.34,
          height: active ? 3 : 2,
          borderRadius: 2,
          backgroundColor: tint,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

export const LibraryIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  const barW = active ? size * 0.2 : 2;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', gap: size * 0.12 }}>
      <View style={{ width: barW, height: size * 0.8, backgroundColor: active ? tint : 'transparent', borderWidth: active ? 0 : 2, borderColor: tint }} />
      <View style={{ width: barW, height: size * 0.8, backgroundColor: active ? tint : 'transparent', borderWidth: active ? 0 : 2, borderColor: tint }} />
      <View
        style={{
          width: barW,
          height: size * 0.8,
          backgroundColor: active ? tint : 'transparent',
          borderWidth: active ? 0 : 2,
          borderColor: tint,
          transform: [{ rotate: '18deg' }, { translateX: size * 0.02 }],
        }}
      />
    </View>
  );
};

export const PlayIcon = ({ size = 18, color = colors.black }: IconProps) => (
  <View
    style={{
      width: 0,
      height: 0,
      marginLeft: size * 0.12,
      borderTopWidth: size * 0.5,
      borderBottomWidth: size * 0.5,
      borderLeftWidth: size * 0.8,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: color,
    }}
  />
);

export const PauseIcon = ({ size = 18, color = colors.black }: IconProps) => (
  <View style={{ flexDirection: 'row', gap: size * 0.28 }}>
    <View style={{ width: size * 0.28, height: size, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: size * 0.28, height: size, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

/** Ícone de loop — anel aberto com seta. Preenche de verde quando ativo. */
export const LoopIcon = ({ size = 20, active, color }: IconProps) => {
  const tint = color ?? (active ? colors.primary : colors.textMuted);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size * 0.74,
          borderWidth: 2,
          borderColor: tint,
          borderRadius: size * 0.28,
          borderRightColor: 'transparent',
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.02,
          top: size * 0.02,
          width: 0,
          height: 0,
          borderTopWidth: 4,
          borderBottomWidth: 4,
          borderLeftWidth: 6,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: tint,
        }}
      />
    </View>
  );
};

export const GearIcon = ({ size = 22, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map((deg) => (
        <View
          key={deg}
          style={{
            position: 'absolute',
            width: size,
            height: size * 0.32,
            borderRadius: 2,
            backgroundColor: tint,
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: colors.bg,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.24,
          height: size * 0.24,
          borderRadius: size * 0.12,
          backgroundColor: tint,
        }}
      />
    </View>
  );
};

/** Três pontos — menu de opções da faixa. */
export const MoreIcon = ({ size = 20, color = colors.textMuted }: IconProps) => {
  const dot = Math.max(2, size * 0.16);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: dot * 0.7 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
      ))}
    </View>
  );
};

export const PlusIcon = ({ size = 20, color = colors.text }: IconProps) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: size, height: 2, borderRadius: 2, backgroundColor: color }} />
    <View style={{ position: 'absolute', width: 2, height: size, borderRadius: 2, backgroundColor: color }} />
  </View>
);

export const ChevronRight = ({ size = 16, color = colors.textFaint }: IconProps) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.42,
        height: size * 0.42,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  </View>
);

/** Seta para baixo sobre uma base — usado na aba Downloader. */
export const DownloadIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: 2, height: size * 0.5, backgroundColor: tint, borderRadius: 2 }} />
      <View
        style={{
          marginTop: -2,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.22,
          borderRightWidth: size * 0.22,
          borderTopWidth: size * 0.22,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: tint,
        }}
      />
      <View
        style={{
          marginTop: size * 0.12,
          width: size * 0.78,
          height: active ? size * 0.16 : 2,
          backgroundColor: active ? tint : 'transparent',
          borderBottomWidth: active ? 0 : 2,
          borderLeftWidth: active ? 0 : 2,
          borderRightWidth: active ? 0 : 2,
          borderColor: tint,
        }}
      />
    </View>
  );
};

/** Pasta — seleção de diretório do dispositivo. */
export const FolderIcon = ({ size = 22, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.44,
          height: size * 0.16,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          backgroundColor: tint,
          marginBottom: -2,
        }}
      />
      <View
        style={{
          width: size,
          height: size * 0.62,
          borderRadius: 3,
          backgroundColor: active ? tint : 'transparent',
          borderWidth: active ? 0 : 2,
          borderColor: tint,
        }}
      />
    </View>
  );
};

/** Relógio — métrica de tempo ouvido. */
export const ClockIcon = ({ size = 22, color = colors.textMuted }: IconProps) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View style={{ position: 'absolute', width: 2, height: size * 0.28, backgroundColor: color, borderRadius: 2, top: size * 0.16 }} />
    <View style={{ position: 'absolute', width: size * 0.22, height: 2, backgroundColor: color, borderRadius: 2, right: size * 0.2 }} />
  </View>
);

/** Barras de gráfico — aba Estatísticas. */
export const StatsIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  const bar = (h: number) => ({
    width: size * 0.2,
    height: size * h,
    backgroundColor: active ? tint : 'transparent',
    borderWidth: active ? 0 : 2,
    borderColor: tint,
    borderRadius: 1.5,
  });
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', gap: size * 0.1 }}>
      <View style={bar(0.45)} />
      <View style={bar(0.8)} />
      <View style={bar(0.6)} />
    </View>
  );
};

/** Lista — aba Principal (músicas baixadas). */
export const ListIcon = ({ size = 24, active, color }: IconProps) => {
  const tint = tintFor(active, color);
  const row = (w: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.16 }}>
      <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: 2, backgroundColor: tint }} />
      <View style={{ width: size * w, height: active ? 3 : 2, borderRadius: 2, backgroundColor: tint }} />
    </View>
  );
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', gap: size * 0.16 }}>
      {row(0.62)}
      {row(0.52)}
      {row(0.58)}
    </View>
  );
};

export const CheckIcon = ({
  size = 16,
  color = colors.text,
  thickness = 2.5,
}: IconProps & { thickness?: number }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.34,
        height: size * 0.62,
        borderRightWidth: thickness,
        borderBottomWidth: thickness,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginTop: -size * 0.08,
      }}
    />
  </View>
);

/** Selo verde de "arquivo salvo / offline" com check. */
export const DownloadedBadge = ({ size = 15 }: { size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CheckIcon size={size * 0.62} color={colors.black} thickness={2} />
  </View>
);

/** Nota musical minimalista — placeholder de capa ausente. */
export const MusicNoteIcon = ({ size = 24, color = colors.textFaint }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.7, height: size * 0.7 }}>
      <View
        style={{
          position: 'absolute',
          right: size * 0.06,
          top: 0,
          width: 2.5,
          height: size * 0.52,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.06,
          top: 0,
          width: size * 0.2,
          height: size * 0.16,
          backgroundColor: color,
          borderTopRightRadius: 3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: size * 0.26,
          height: size * 0.2,
          borderRadius: size * 0.13,
          backgroundColor: color,
        }}
      />
    </View>
  </View>
);

export const SkipIcon = ({
  size = 26,
  color = colors.text,
  dir = 'next',
}: IconProps & { dir?: 'next' | 'prev' }) => {
  const tri = (
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: size * 0.28,
        borderBottomWidth: size * 0.28,
        borderLeftWidth: size * 0.34,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      }}
    />
  );
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: dir === 'prev' ? '180deg' : '0deg' }],
      }}
    >
      {tri}
      {tri}
      <View style={{ width: 2.5, height: size * 0.56, backgroundColor: color, marginLeft: 1 }} />
    </View>
  );
};

/** Repetir — anel com seta; "1" quando repeat-one; verde quando ativo. */
export const RepeatIcon = ({
  size = 22,
  mode = 'off',
  color,
}: IconProps & { mode?: 'off' | 'all' | 'one' }) => {
  const tint = color ?? (mode === 'off' ? colors.textMuted : colors.primary);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.9,
          height: size * 0.66,
          borderWidth: 2,
          borderColor: tint,
          borderRadius: size * 0.24,
          borderRightColor: 'transparent',
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.02,
          top: size * 0.08,
          width: 0,
          height: 0,
          borderTopWidth: 4,
          borderBottomWidth: 4,
          borderLeftWidth: 6,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: tint,
        }}
      />
      {mode === 'one' && (
        <View
          style={{
            position: 'absolute',
            width: 7,
            height: 10,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 2, height: 10, backgroundColor: tint }} />
        </View>
      )}
    </View>
  );
};
