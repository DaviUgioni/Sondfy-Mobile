import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ShareIntentProvider } from 'expo-share-intent';

import { colors } from './src/theme';
import { SettingsProvider } from './src/settings/SettingsContext';
import { LibraryProvider } from './src/library/LibraryContext';
import { PlayerProvider } from './src/player/PlayerContext';
import ShareIntentBridge from './src/share/ShareIntentBridge';
import MainScreen from './src/screens/MainScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FolderPickerScreen from './src/screens/FolderPickerScreen';
import PlayerScreen from './src/screens/PlayerScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <ShareIntentProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SettingsProvider>
          <LibraryProvider>
            <ShareIntentBridge />
            <PlayerProvider>
              <NavigationContainer theme={navTheme}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="Main" component={MainScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="FolderPicker" component={FolderPickerScreen} />
                <Stack.Screen
                  name="Player"
                  component={PlayerScreen}
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
                </Stack.Navigator>
              </NavigationContainer>
            </PlayerProvider>
          </LibraryProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
