import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { STORAGE_KEYS, loadJSON, saveJSON } from '../storage/persist';
import {
  LocalTrackInput,
  SharedFile,
  copySharedFilesToLibrary,
  downloadFromServer,
  isUriAvailable,
  pickAudioFiles,
  pickAudioFolder,
} from './importAudio';
import { useSettings } from '../settings/SettingsContext';

/** Faixa da biblioteca local do usuário. Persistida em AsyncStorage. */
export type DownloadedTrack = {
  id: string;
  /** Nome real da faixa (nome do arquivo importado, sem extensão). */
  title: string;
  /** URI reproduzível: `file://` (cópia no app) ou `content://` (pasta SAF). */
  uri: string;
  /** Nome do arquivo com extensão — mostra a origem real. */
  fileName?: string;
  /** Como a faixa entrou: seletor de arquivos, pasta do dispositivo, ou legado. */
  origin: 'file' | 'folder' | 'youtube';
  /** Link de origem (apenas faixas legadas do downloader). */
  sourceUrl?: string;
  /** Capa da faixa (apenas faixas legadas do downloader). */
  thumbnailUrl?: string;
  /** Pasta/origem legível. */
  folderPath: string;
  /** Duração em segundos. 0 até a faixa ser tocada pela primeira vez. */
  durationSec: number;
  format: string;
  sizeMB: number;
  addedAt: number;
  /** Quantas vezes o usuário reproduziu esta faixa. */
  playCount: number;
  /** true quando o arquivo não está mais acessível (movido/removido). */
  missing?: boolean;
};

export type LibraryStats = {
  totalListenedSec: number;
  downloadCount: number;
  mostPlayed: DownloadedTrack | null;
};

/** Resultado de uma tentativa de importação, para a UI dar feedback. */
export type ImportResult = {
  ok: boolean;
  added: number;
  duplicates: number;
  /** total de arquivos de áudio encontrados (pasta) */
  found: number;
  /** motivo da falha, quando `ok` é false */
  reason: 'cancel' | 'denied' | 'empty' | 'error' | 'noserver' | null;
  /** mensagem detalhada (usada no download por link) */
  message?: string;
};

type LegacyDownloadInput = {
  id: string;
  title: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  folderPath: string;
  durationSec: number;
  format: string;
  sizeMB: number;
};

type LibraryValue = {
  downloads: DownloadedTrack[];
  totalListenedSec: number;
  stats: LibraryStats;
  /** true depois que o estado salvo foi carregado do disco. */
  hydrated: boolean;
  /** Importa arquivos avulsos pelo seletor do SO (copiados para o app). */
  importFiles: () => Promise<ImportResult>;
  /** Importa todos os áudios de uma pasta do dispositivo (SAF, Android). */
  importFolder: () => Promise<ImportResult>;
  /** Baixa o áudio de um link pelo servidor pessoal e adiciona à biblioteca. */
  importFromLink: (videoUrl: string) => Promise<ImportResult>;
  /** Importa arquivos de áudio recebidos via "Compartilhar" (ex.: NewPipe). */
  importSharedFiles: (files: SharedFile[]) => Promise<ImportResult>;
  /** Reavalia quais faixas ainda têm o arquivo acessível. */
  refreshAvailability: () => Promise<void>;
  /** Grava a duração real assim que o player a descobre. */
  updateTrackDuration: (id: string, durationSec: number) => void;
  /** Compat: faixa "baixada" pelo downloader legado (simulado). */
  addDownload: (input: LegacyDownloadInput) => DownloadedTrack;
  registerPlay: (id: string) => void;
  addListenedSeconds: (seconds: number) => void;
  removeDownload: (id: string) => void;
};

type PersistedLibrary = {
  downloads: DownloadedTrack[];
  totalListenedSec: number;
};

const LibraryContext = createContext<LibraryValue | null>(null);

function inputToTrack(input: LocalTrackInput): DownloadedTrack {
  return {
    id: input.uri, // URI é estável — serve de id e evita duplicar a mesma faixa.
    title: input.title,
    uri: input.uri,
    fileName: input.fileName,
    origin: input.origin,
    folderPath: input.folderPath,
    durationSec: input.durationSec && input.durationSec > 0 ? Math.round(input.durationSec) : 0,
    format: input.format,
    sizeMB: input.sizeMB,
    addedAt: Date.now(),
    playCount: 0,
  };
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { setFolder, downloadServerUrl, downloadServerKey, defaultFormat } = useSettings();

  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [totalListenedSec, setTotalListenedSec] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // 1. Carrega o estado salvo no arranque e reconstrói a lista.
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadJSON<PersistedLibrary>(STORAGE_KEYS.library, {
        downloads: [],
        totalListenedSec: 0,
      });
      if (!alive) return;
      const list = Array.isArray(saved.downloads) ? saved.downloads : [];
      setDownloads(list.sort((a, b) => b.addedAt - a.addedAt));
      setTotalListenedSec(Number(saved.totalListenedSec) || 0);
      hydratedRef.current = true;
      setHydrated(true);

      // 2. Depois de reconstruir, confere o que ainda está acessível.
      const checked = await Promise.all(
        list.map(async (t) => ({ ...t, missing: !(await isUriAvailable(t.uri)) }))
      );
      if (!alive) return;
      setDownloads(checked.sort((a, b) => b.addedAt - a.addedAt));
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 3. Sempre que a biblioteca muda (após hidratar), persiste.
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJSON(STORAGE_KEYS.library, { downloads, totalListenedSec });
  }, [downloads, totalListenedSec]);

  const mergeTracks = useCallback((incoming: DownloadedTrack[]) => {
    let added = 0;
    let duplicates = 0;
    setDownloads((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]));
      for (const t of incoming) {
        if (byId.has(t.id)) {
          duplicates += 1;
          // Reaparecer = arquivo voltou a existir: limpa o "missing".
          byId.set(t.id, { ...byId.get(t.id)!, missing: false });
        } else {
          byId.set(t.id, t);
          added += 1;
        }
      }
      return Array.from(byId.values()).sort((a, b) => b.addedAt - a.addedAt);
    });
    return { added, duplicates };
  }, []);

  const importFiles = useCallback<LibraryValue['importFiles']>(async () => {
    try {
      const inputs = await pickAudioFiles();
      if (inputs.length === 0) {
        return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'cancel' };
      }
      const { added, duplicates } = mergeTracks(inputs.map(inputToTrack));
      return { ok: true, added, duplicates, found: inputs.length, reason: null };
    } catch (err) {
      console.warn('[library] importFiles falhou:', err);
      return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'error' };
    }
  }, [mergeTracks]);

  const importFolder = useCallback<LibraryValue['importFolder']>(async () => {
    try {
      const res = await pickAudioFolder();
      if (!res) {
        return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'denied' };
      }
      setFolder({ uri: res.folder.uri, label: res.folder.label, kind: 'saf' });
      if (res.found === 0) {
        return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'empty' };
      }
      const { added, duplicates } = mergeTracks(res.tracks.map(inputToTrack));
      return { ok: true, added, duplicates, found: res.found, reason: null };
    } catch (err) {
      console.warn('[library] importFolder falhou:', err);
      return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'error' };
    }
  }, [mergeTracks, setFolder]);

  const importFromLink = useCallback<LibraryValue['importFromLink']>(
    async (videoUrl) => {
      if (!downloadServerUrl.trim()) {
        return {
          ok: false,
          added: 0,
          duplicates: 0,
          found: 0,
          reason: 'noserver',
          message: 'Configure o servidor de download em Configurações.',
        };
      }
      try {
        const input = await downloadFromServer({
          serverUrl: downloadServerUrl,
          apiKey: downloadServerKey,
          videoUrl,
          format: defaultFormat === 'MP3' ? 'mp3' : 'm4a',
        });
        const { added, duplicates } = mergeTracks([inputToTrack(input)]);
        return { ok: true, added, duplicates, found: 1, reason: null };
      } catch (err: any) {
        console.warn('[library] importFromLink falhou:', err);
        return {
          ok: false,
          added: 0,
          duplicates: 0,
          found: 0,
          reason: 'error',
          message: err?.message ? String(err.message) : 'Falha ao baixar.',
        };
      }
    },
    [downloadServerUrl, downloadServerKey, defaultFormat, mergeTracks]
  );

  const importSharedFiles = useCallback<LibraryValue['importSharedFiles']>(
    async (files) => {
      try {
        const inputs = await copySharedFilesToLibrary(files ?? []);
        if (inputs.length === 0) {
          return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'empty' };
        }
        const { added, duplicates } = mergeTracks(inputs.map(inputToTrack));
        return { ok: true, added, duplicates, found: inputs.length, reason: null };
      } catch (err) {
        console.warn('[library] importSharedFiles falhou:', err);
        return { ok: false, added: 0, duplicates: 0, found: 0, reason: 'error' };
      }
    },
    [mergeTracks]
  );

  const refreshAvailability = useCallback<LibraryValue['refreshAvailability']>(async () => {
    const current = downloads;
    if (current.length === 0) return;
    const checked = await Promise.all(
      current.map(async (t) => {
        const missing = !(await isUriAvailable(t.uri));
        return missing === !!t.missing ? t : { ...t, missing };
      })
    );
    setDownloads(checked);
  }, [downloads]);

  const updateTrackDuration = useCallback<LibraryValue['updateTrackDuration']>((id, durationSec) => {
    if (!durationSec || durationSec <= 0) return;
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id && Math.abs((d.durationSec || 0) - durationSec) > 1
          ? { ...d, durationSec: Math.round(durationSec) }
          : d
      )
    );
  }, []);

  const addDownload = useCallback<LibraryValue['addDownload']>((input) => {
    const track: DownloadedTrack = {
      ...input,
      uri: input.sourceUrl,
      origin: 'youtube',
      addedAt: Date.now(),
      playCount: 0,
    };
    setDownloads((prev) => {
      if (prev.some((d) => d.id === track.id)) return prev;
      return [track, ...prev].sort((a, b) => b.addedAt - a.addedAt);
    });
    return track;
  }, []);

  const registerPlay = useCallback((id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, playCount: d.playCount + 1 } : d))
    );
  }, []);

  const addListenedSeconds = useCallback((seconds: number) => {
    setTotalListenedSec((s) => s + seconds);
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const stats = useMemo<LibraryStats>(() => {
    const mostPlayed = downloads.reduce<DownloadedTrack | null>((best, d) => {
      if (d.playCount === 0) return best;
      if (!best || d.playCount > best.playCount) return d;
      return best;
    }, null);
    return { totalListenedSec, downloadCount: downloads.length, mostPlayed };
  }, [downloads, totalListenedSec]);

  const value: LibraryValue = {
    downloads,
    totalListenedSec,
    stats,
    hydrated,
    importFiles,
    importFolder,
    importFromLink,
    importSharedFiles,
    refreshAvailability,
    updateTrackDuration,
    addDownload,
    registerPlay,
    addListenedSeconds,
    removeDownload,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary deve ser usado dentro de <LibraryProvider>');
  return ctx;
}
