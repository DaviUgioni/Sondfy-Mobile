import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing } from '../theme';
import GradientBackground from '../components/GradientBackground';
import MiniPlayer from '../components/MiniPlayer';
import BottomNav, { TabKey } from '../components/BottomNav';
import HomeTab from './tabs/HomeTab';
import StatsTab from './tabs/StatsTab';
import ImportTab from './tabs/ImportTab';
import { usePlayer } from '../player/PlayerContext';

type RootStackParamList = { Main: undefined; Settings: undefined; Player: undefined };
type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function MainScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<TabKey>('principal');
  const player = usePlayer();

  return (
    <GradientBackground tint={colors.bgGradientTop}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.body}>
          {tab === 'principal' && (
            <HomeTab
              onOpenImport={() => setTab('importar')}
              onOpenSettings={() => navigation.navigate('Settings')}
            />
          )}
          {tab === 'estatisticas' && <StatsTab />}
          {tab === 'importar' && <ImportTab />}
        </View>
      </SafeAreaView>

      {/* Camada flutuante: mini player (só quando há faixa) + bottom bar */}
      <View style={styles.dock} pointerEvents="box-none">
        {player.track && (
          <MiniPlayer
            track={player.track}
            playing={player.playing}
            looping={player.looping}
            progress={player.progress}
            onTogglePlay={player.togglePlay}
            onToggleLoop={player.toggleLoop}
            onDismiss={player.dismiss}
            onPress={() => navigation.navigate('Player')}
          />
        )}
        <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
          <BottomNav active={tab} onChange={setTab} />
        </SafeAreaView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.xs,
  },
  bottomSafe: { backgroundColor: colors.bottomBar },
});
