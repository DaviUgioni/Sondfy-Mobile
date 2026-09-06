import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

import { DownloadedTrack, useLibrary } from '../library/LibraryContext';

type PlayerContextValue = {
  /** null quando nada foi selecionado para tocar. */
  track: DownloadedTrack | null;
  playing: boolean;
  /** Loop da faixa atual (recurso Sondfy). */
  looping: boolean;
  /** true enquanto o áudio ainda está carregando. */
  loading: boolean;
  /** Mensagem de erro da última tentativa de reprodução (ou null). */
  error: string | null;
  /** 0..1 */
  progress: number;
  elapsedSec: number;
  durationSec: number;
  playTrack: (t: DownloadedTrack) => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  /** Para a faixa: pausa e volta ao início, mantendo-a carregada. */
  stop: () => void;
  /** Para e fecha o player (esconde o mini player). */
  dismiss: () => void;
  /** Próxima faixa disponível da lista (pula faixas com arquivo ausente). */
  next: () => void;
  /** Faixa anterior; se já passou de 3s, apenas reinicia a atual. */
  previous: () => void;
  /** Move para uma posição da faixa, fração 0..1. */
  seek: (fraction: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { downloads, registerPlay, addListenedSeconds, updateTrackDuration } = useLibrary();

  // Instância única de áudio real — vive enquanto o app estiver aberto, então
  // a música continua tocando ao navegar entre as telas.
  const playerRef = useRef<AudioPlayer | null>(null);
  if (!playerRef.current) {
    playerRef.current = createAudioPlayer(null, { updateInterval: 500 });
  }
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [track, setTrack] = useState<DownloadedTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  // Espelhos para uso dentro do listener nativo (evita closure velha).
  const trackRef = useRef<DownloadedTrack | null>(null);
  const loopingRef = useRef(false);
  const durationRef = useRef(0);

  const ordered = useMemo(
    () => [...downloads].sort((a, b) => b.addedAt - a.addedAt),
    [downloads]
  );
  const orderedRef = useRef(ordered);
  useEffect(() => {
    orderedRef.current = ordered;
  }, [ordered]);

  // --- reprodução interna (usada por playTrack, next, previous) ---
  const load = useCallback(
    (t: DownloadedTrack) => {
      const player = playerRef.current;
      if (!player) return;

      if (t.missing) {
        Alert.alert(
          'Arquivo indisponível',
          `"${t.title}" foi movido ou removido do dispositivo e não pode ser reproduzido.`
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);
        if (loadTimeout.current) clearTimeout(loadTimeout.current);
        player.replace({ uri: t.uri });
        player.loop = loopingRef.current;
        player.play();
        setTrack(t);
        trackRef.current = t;
        setElapsedSec(0);
        setDurationSec(t.durationSec || 0);
        durationRef.current = t.durationSec || 0;
        registerPlay(t.id);
        // Rede de segurança: se em 15s nada carregou, mostra erro (sem crashar).
        loadTimeout.current = setTimeout(() => {
          if (!playerRef.current?.isLoaded) {
            setLoading(false);
            setError('Não foi possível carregar este áudio.');
          }
        }, 15000);
      } catch (err) {
        console.warn('[player] falha ao carregar faixa:', err);
        setLoading(false);
        setError('Não foi possível reproduzir este arquivo.');
        Alert.alert(
          'Erro ao reproduzir',
          'Não foi possível carregar este áudio. O arquivo pode estar corrompido ou em um formato não suportado.'
        );
      }
    },
    [registerPlay]
  );

  const advanceAuto = useCallback(() => {
    const list = orderedRef.current;
    const cur = trackRef.current;
    if (!cur) return;
    const i = list.findIndex((d) => d.id === cur.id);
    // Próxima faixa disponível (pula arquivos ausentes).
    for (let j = i + 1; j < list.length; j += 1) {
      if (!list[j].missing) {
        load(list[j]);
        return;
      }
    }
    // Acabou a lista: para no fim.
    setPlaying(false);
  }, [load]);

  // --- configura o áudio e assina o status uma única vez ---
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((err) => console.warn('[player] setAudioModeAsync:', err));

    const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      setPlaying(status.playing);
      if (status.isLoaded) {
        setLoading(false);
        if (loadTimeout.current) {
          clearTimeout(loadTimeout.current);
          loadTimeout.current = null;
        }
      }

      if (typeof status.currentTime === 'number' && !Number.isNaN(status.currentTime)) {
        setElapsedSec(status.currentTime);
      }

      if (status.duration && status.duration > 0) {
        setDurationSec(status.duration);
        durationRef.current = status.duration;
        const t = trackRef.current;
        if (t && (!t.durationSec || Math.abs(t.durationSec - status.duration) > 1)) {
          updateTrackDuration(t.id, status.duration);
        }
      }

      if (status.didJustFinish && !loopingRef.current) {
        advanceAuto();
      }
    });

    return () => {
      sub.remove();
      if (loadTimeout.current) clearTimeout(loadTimeout.current);
      // A instância de áudio é mantida viva de propósito: só é liberada quando
      // o app inteiro é encerrado. Assim sobrevive a remounts (ex.: StrictMode).
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conta o tempo ouvido só enquanto realmente está tocando.
  useEffect(() => {
    if (!playing || !track) return;
    const id = setInterval(() => addListenedSeconds(1), 1000);
    return () => clearInterval(id);
  }, [playing, track, addListenedSeconds]);

  // Mantém a faixa atual em sincronia com a biblioteca: se ela foi removida,
  // fecha o player; se mudou (duração real, ficou indisponível), atualiza.
  useEffect(() => {
    if (!track) return;
    const fresh = downloads.find((d) => d.id === track.id);
    if (!fresh) {
      try {
        playerRef.current?.pause();
      } catch {
        /* noop */
      }
      setTrack(null);
      trackRef.current = null;
      setPlaying(false);
      return;
    }
    if (fresh !== track) {
      setTrack(fresh);
      trackRef.current = fresh;
    }
  }, [downloads, track]);

  const playTrack = useCallback((t: DownloadedTrack) => load(t), [load]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player || !trackRef.current) return;
    try {
      if (player.playing) {
        player.pause();
      } else {
        // Se terminou, recomeça do início.
        if (durationRef.current && elapsedSec >= durationRef.current - 0.5) {
          player.seekTo(0).catch(() => undefined);
        }
        player.play();
      }
    } catch (err) {
      console.warn('[player] togglePlay:', err);
    }
  }, [elapsedSec]);

  const toggleLoop = useCallback(() => {
    setLooping((l) => {
      const nextVal = !l;
      loopingRef.current = nextVal;
      try {
        if (playerRef.current) playerRef.current.loop = nextVal;
      } catch (err) {
        console.warn('[player] toggleLoop:', err);
      }
      return nextVal;
    });
  }, []);

  const stop = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.pause();
      player.seekTo(0).catch(() => undefined);
    } catch (err) {
      console.warn('[player] stop:', err);
    }
    setPlaying(false);
    setElapsedSec(0);
  }, []);

  const dismiss = useCallback(() => {
    stop();
    setTrack(null);
    trackRef.current = null;
  }, [stop]);

  const next = useCallback(() => {
    const list = orderedRef.current;
    const cur = trackRef.current;
    if (!cur) return;
    const i = list.findIndex((d) => d.id === cur.id);
    for (let j = i + 1; j < list.length; j += 1) {
      if (!list[j].missing) {
        load(list[j]);
        return;
      }
    }
    stop();
  }, [load, stop]);

  const previous = useCallback(() => {
    const list = orderedRef.current;
    const cur = trackRef.current;
    if (!cur) return;
    if (elapsedSec > 3) {
      playerRef.current?.seekTo(0).catch(() => undefined);
      setElapsedSec(0);
      return;
    }
    const i = list.findIndex((d) => d.id === cur.id);
    for (let j = i - 1; j >= 0; j -= 1) {
      if (!list[j].missing) {
        load(list[j]);
        return;
      }
    }
    playerRef.current?.seekTo(0).catch(() => undefined);
    setElapsedSec(0);
  }, [elapsedSec, load]);

  const seek = useCallback((fraction: number) => {
    const player = playerRef.current;
    const dur = durationRef.current;
    if (!player || !dur) return;
    const target = clamp01(fraction) * dur;
    setElapsedSec(target);
    player.seekTo(target).catch((err) => console.warn('[player] seek:', err));
  }, []);

  const value: PlayerContextValue = {
    track,
    playing,
    looping,
    loading,
    error,
    elapsedSec,
    durationSec,
    progress: durationSec ? clamp01(elapsedSec / durationSec) : 0,
    playTrack,
    togglePlay,
    toggleLoop,
    stop,
    dismiss,
    next,
    previous,
    seek,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer deve ser usado dentro de <PlayerProvider>');
  return ctx;
}
