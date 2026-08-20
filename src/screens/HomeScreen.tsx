import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Dimensions, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  input: '#2a2a2a',
  primary: '#1db954',
  text: '#ffffff',
  subtext: '#b3b3b3',
  muted: '#727272',
  border: '#2a2a2a',
  playerBg: '#181818',
};

type Song = { id: string; title: string; artist: string; duration: string };

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);

  const handleSearch = () => {
    Keyboard.dismiss();
    console.log('Buscar:', searchText);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>♪</Text>
      <Text style={styles.emptyTitle}>Nenhuma música ainda</Text>
      <Text style={styles.emptySubtitle}>
        Cole um link do YouTube acima para começar
      </Text>
    </View>
  );

  const SongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.songCard} activeOpacity={0.7}>
      <View style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songSubtitle}>{item.artist} · {item.duration}</Text>
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={() => console.log('Play', item.title)}>
        <Text style={styles.playIcon}>▶</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Sondfy</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cole um link do YouTube..."
            placeholderTextColor={COLORS.muted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listSection}>
        {songs.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={songs}
            renderItem={SongItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Suas Músicas</Text>}
          />
        )}
      </View>

      <View style={styles.player}>
        <View style={styles.playerTrack}>
          <View style={styles.playerCover} />
          <View style={styles.playerText}>
            <Text style={styles.playerTitle}>Nada tocando</Text>
            <Text style={styles.playerArtist}>Selecione uma música</Text>
          </View>
        </View>

        <View style={styles.playerControls}>
          <View style={styles.playerButtons}>
            <TouchableOpacity onPress={() => console.log('Anterior')}>
              <Text style={styles.controlBtn}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainPlayBtn} onPress={() => console.log('Play/Pause')}>
              <Text style={styles.mainPlayIcon}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => console.log('Próxima')}>
              <Text style={styles.controlBtn}>⏭</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressTime}>0:00</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressTime}>0:00</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  appTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22, color: COLORS.subtext },
  searchSection: { paddingHorizontal: 16, paddingVertical: 16 },
  searchRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: COLORS.input, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  searchBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '600' },
  listSection: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, marginLeft: 4 },
  listContent: { paddingBottom: 100, gap: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, color: COLORS.muted },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.subtext, textAlign: 'center' },
  songCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 12, gap: 12, minHeight: 72 },
  songCover: { width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.input },
  songInfo: { flex: 1, gap: 2 },
  songTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  songSubtitle: { fontSize: 13, color: COLORS.subtext },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
  playIcon: { fontSize: 16, color: COLORS.bg, marginLeft: 2 },
  player: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.playerBg, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 20 },
  playerTrack: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  playerCover: { width: 56, height: 56, borderRadius: 6, backgroundColor: COLORS.input },
  playerText: { flex: 1, gap: 2 },
  playerTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  playerArtist: { fontSize: 12, color: COLORS.subtext },
  playerControls: { alignItems: 'center', gap: 8 },
  playerButtons: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  controlBtn: { fontSize: 20, color: COLORS.subtext },
  mainPlayBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  mainPlayIcon: { fontSize: 18, color: COLORS.bg, marginLeft: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  progressTime: { fontSize: 11, color: COLORS.muted, fontVariant: ['tabular-nums'], minWidth: 36 },
  progressBar: { flex: 1, height: 4, backgroundColor: COLORS.input, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', width: 0, backgroundColor: COLORS.primary, borderRadius: 2 },
});