import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  primary: '#1db954',
  text: '#ffffff',
  subtext: '#b3b3b3',
  muted: '#727272',
  border: '#2a2a2a',
};

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Gerenciar conta</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Sair</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Tema</Text>
            <Text style={styles.settingsValue}>Escuro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Idioma</Text>
            <Text style={styles.settingsValue}>Português</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <TouchableOpacity style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Versão</Text>
            <Text style={styles.settingsValue}>1.0.0</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { paddingVertical: 8 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center', marginLeft: -40 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 },
  settingsLabel: { fontSize: 16, color: COLORS.text },
  settingsValue: { fontSize: 16, color: COLORS.subtext },
  chevron: { fontSize: 18, color: COLORS.muted },
});