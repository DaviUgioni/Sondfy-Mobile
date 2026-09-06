import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../theme';
import { ListIcon, StatsIcon, DownloadIcon } from './Icon';

export type TabKey = 'principal' | 'estatisticas' | 'downloader';

type Props = {
  active: TabKey;
  onChange: (t: TabKey) => void;
};

const TABS: { key: TabKey; label: string; Icon: typeof ListIcon }[] = [
  { key: 'principal', label: 'Músicas', Icon: ListIcon },
  { key: 'estatisticas', label: 'Estatísticas', Icon: StatsIcon },
  { key: 'downloader', label: 'Downloader', Icon: DownloadIcon },
];

/** Barra de navegação inferior fixa, fundo preto translúcido. */
export default function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <TouchableOpacity
            key={key}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => onChange(key)}
          >
            <Icon size={24} active={isActive} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: layout.bottomBarHeight,
    backgroundColor: colors.bottomBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingBottom: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: { color: colors.textMuted, ...typography.caption, fontSize: 10 },
  labelActive: { color: colors.text },
});
