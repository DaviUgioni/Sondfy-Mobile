import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** Faixa baixada e salva no dispositivo. Só existe após um download real do usuário. */
export type DownloadedTrack = {
  id: string;
  /** Derivado do link colado (id do vídeo do YouTube). */
  title: string;
  sourceUrl: string;
  /** Capa da faixa (thumbnail do vídeo de origem). */
  thumbnailUrl?: string;
  /** Pasta do dispositivo onde o arquivo foi salvo. */
  folderPath: string;
  durationSec: number;
  format: string;
  sizeMB: number;
  addedAt: number;
  /** Quantas vezes o usuário reproduziu esta faixa. */
  playCount: number;
};

export type LibraryStats = {
  totalListenedSec: number;
  downloadCount: number;
  mostPlayed: DownloadedTrack | null;
};

type LibraryValue = {
  downloads: DownloadedTrack[];
  totalListenedSec: number;
  stats: LibraryStats;
  addDownload: (input: {
    id: string;
    title: string;
    sourceUrl: string;
    thumbnailUrl?: string;
    folderPath: string;
    durationSec: number;
    format: string;
    sizeMB: number;
  }) => DownloadedTrack;
  registerPlay: (id: string) => void;
  addListenedSeconds: (seconds: number) => void;
  removeDownload: (id: string) => void;
};

const LibraryContext = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  // Começa vazio — nada de conteúdo pré-carregado.
  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [totalListenedSec, setTotalListenedSec] = useState(0);

  const addDownload = useCallback<LibraryValue['addDownload']>((input) => {
    const track: DownloadedTrack = { ...input, addedAt: Date.now(), playCount: 0 };
    setDownloads((prev) => {
      if (prev.some((d) => d.id === track.id)) return prev;
      // Mais recente sempre no topo.
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
