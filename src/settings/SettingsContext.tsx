import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { STORAGE_KEYS, loadJSON, saveJSON } from '../storage/persist';

export type AudioFormat = 'MP3' | 'M4A' | 'FLAC';

export const AUDIO_FORMATS: AudioFormat[] = ['MP3', 'M4A', 'FLAC'];

/** Pasta/origem de músicas escolhida pelo usuário no armazenamento do dispositivo. */
export type MusicFolder = {
  /** URI real: árvore SAF (`content://.../tree/...`) no Android, ou marcador de "arquivos". */
  uri: string;
  /** Nome legível mostrado nas telas. */
  label: string;
  /** 'saf' = pasta do dispositivo via Storage Access Framework; 'files' = arquivos avulsos. */
  kind: 'saf' | 'files';
};

type SettingsValue = {
  /** Última pasta do dispositivo escolhida (null enquanto o usuário não escolheu nenhuma). */
  folder: MusicFolder | null;
  setFolder: (f: MusicFolder | null) => void;
  defaultFormat: AudioFormat;
  setDefaultFormat: (f: AudioFormat) => void;
  /** URL base do servidor pessoal de download (pasta `server/`). Vazio = desativado. */
  downloadServerUrl: string;
  setDownloadServerUrl: (u: string) => void;
  /** API_KEY do servidor de download. */
  downloadServerKey: string;
  setDownloadServerKey: (k: string) => void;
  /** true depois que as configurações salvas foram carregadas. */
  hydrated: boolean;
};

type PersistedSettings = {
  folder: MusicFolder | null;
  defaultFormat: AudioFormat;
  downloadServerUrl: string;
  downloadServerKey: string;
};

const DEFAULTS: PersistedSettings = {
  folder: null,
  defaultFormat: 'MP3',
  downloadServerUrl: '',
  downloadServerKey: '',
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [folder, setFolderState] = useState<MusicFolder | null>(DEFAULTS.folder);
  const [defaultFormat, setDefaultFormatState] = useState<AudioFormat>(DEFAULTS.defaultFormat);
  const [downloadServerUrl, setDownloadServerUrlState] = useState(DEFAULTS.downloadServerUrl);
  const [downloadServerKey, setDownloadServerKeyState] = useState(DEFAULTS.downloadServerKey);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadJSON<PersistedSettings>(STORAGE_KEYS.settings, DEFAULTS);
      if (!alive) return;
      setFolderState(saved.folder ?? null);
      if (saved.defaultFormat) setDefaultFormatState(saved.defaultFormat);
      setDownloadServerUrlState(saved.downloadServerUrl ?? '');
      setDownloadServerKeyState(saved.downloadServerKey ?? '');
      hydratedRef.current = true;
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJSON(STORAGE_KEYS.settings, {
      folder,
      defaultFormat,
      downloadServerUrl,
      downloadServerKey,
    });
  }, [folder, defaultFormat, downloadServerUrl, downloadServerKey]);

  const setFolder = useCallback((f: MusicFolder | null) => setFolderState(f), []);
  const setDefaultFormat = useCallback((f: AudioFormat) => setDefaultFormatState(f), []);
  const setDownloadServerUrl = useCallback((u: string) => setDownloadServerUrlState(u), []);
  const setDownloadServerKey = useCallback((k: string) => setDownloadServerKeyState(k), []);

  return (
    <SettingsContext.Provider
      value={{
        folder,
        setFolder,
        defaultFormat,
        setDefaultFormat,
        downloadServerUrl,
        setDownloadServerUrl,
        downloadServerKey,
        setDownloadServerKey,
        hydrated,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de <SettingsProvider>');
  return ctx;
}
