import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DownloadedTrack, useLibrary } from '../library/LibraryContext';

type PlayerContextValue = {
  /** null quando nada foi selecionado para tocar. */
  track: DownloadedTrack | null;
  playing: boolean;
  /** Loop da faixa atual (recurso Sondfy). */
  looping: boolean;
  /** 0..1 */
  progress: number;
  elapsedSec: number;
  durationSec: number;
  playTrack: (t: DownloadedTrack) => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  /** Próxima faixa da lista de baixadas (ou reinicia se for a última). */
  next: () => void;
  /** Faixa anterior; se já passou de 3s, apenas reinicia a atual. */
  previous: () => void;
  /** Move para uma posição da faixa, fração 0..1. */
  seek: (fraction: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { downloads, registerPlay, addListenedSeconds } = useLibrary();

  const [track, setTrack] = useState<DownloadedTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const durationSec = track?.durationSec ?? 0;
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const ordered = useMemo(
    () => [...downloads].sort((a, b) => b.addedAt - a.addedAt),
    [downloads]
  );

  useEffect(() => {
    if (playing && track) {
      tick.current = setInterval(() => {
        addListenedSeconds(1);
        setElapsedSec((e) => {
          const next = e + 1;
          if (next >= durationSec) return looping ? 0 : durationSec;
          return next;
        });
      }, 1000);
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [playing, track, durationSec, looping, addListenedSeconds]);

  const play = (t: DownloadedTrack) => {
    setTrack(t);
    setElapsedSec(0);
    setPlaying(true);
    registerPlay(t.id);
  };

  const value: PlayerContextValue = {
    track,
    playing,
    looping,
    elapsedSec,
    durationSec,
    progress: durationSec ? Math.min(1, elapsedSec / durationSec) : 0,
    playTrack: play,
    togglePlay: () => setPlaying((p) => !p),
    toggleLoop: () => setLooping((l) => !l),
    next: () => {
      if (!track) return;
      const i = ordered.findIndex((d) => d.id === track.id);
      if (i >= 0 && i < ordered.length - 1) play(ordered[i + 1]);
      else setElapsedSec(0);
    },
    previous: () => {
      if (!track) return;
      if (elapsedSec > 3) {
        setElapsedSec(0);
        return;
      }
      const i = ordered.findIndex((d) => d.id === track.id);
      if (i > 0) play(ordered[i - 1]);
      else setElapsedSec(0);
    },
    seek: (fraction) => setElapsedSec(Math.round(Math.max(0, Math.min(1, fraction)) * durationSec)),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer deve ser usado dentro de <PlayerProvider>');
  return ctx;
}
