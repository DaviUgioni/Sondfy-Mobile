import React, { createContext, useContext, useState } from 'react';

export type AudioFormat = 'MP3' | 'M4A' | 'FLAC';

export type DeviceFolder = {
  id: string;
  label: string;
  /** Caminho no armazenamento do dispositivo. */
  path: string;
};

/** Pastas comuns do armazenamento do celular que o usuário pode escolher. */
export const DEVICE_FOLDERS: DeviceFolder[] = [
  { id: 'sondfy', label: 'Sondfy', path: '/storage/emulated/0/Music/Sondfy' },
  { id: 'music', label: 'Music', path: '/storage/emulated/0/Music' },
  { id: 'downloads', label: 'Download', path: '/storage/emulated/0/Download' },
  { id: 'podcasts', label: 'Podcasts', path: '/storage/emulated/0/Podcasts' },
  { id: 'wa-audio', label: 'WhatsApp Audio', path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio' },
];

export const AUDIO_FORMATS: AudioFormat[] = ['MP3', 'M4A', 'FLAC'];

type SettingsValue = {
  /** Pasta do dispositivo usada pelo app (destino dos downloads e origem do que aparece na lista). */
  folder: DeviceFolder;
  setFolder: (f: DeviceFolder) => void;
  defaultFormat: AudioFormat;
  setDefaultFormat: (f: AudioFormat) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [folder, setFolder] = useState<DeviceFolder>(DEVICE_FOLDERS[0]);
  const [defaultFormat, setDefaultFormat] = useState<AudioFormat>('MP3');

  return (
    <SettingsContext.Provider value={{ folder, setFolder, defaultFormat, setDefaultFormat }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de <SettingsProvider>');
  return ctx;
}
