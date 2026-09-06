/**
 * Camada única de persistência do app, sobre AsyncStorage.
 *
 * Todo o estado que precisa sobreviver ao fechar/abrir o app passa por aqui:
 * biblioteca de faixas, tempo ouvido e configurações. Nada de sistema paralelo.
 * Todas as operações são tolerantes a falha — nunca lançam para a UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  /** Faixas importadas + tempo total ouvido. */
  library: 'sondfy:v1:library',
  /** Pasta escolhida e formato padrão. */
  settings: 'sondfy:v1:settings',
} as const;

/** Lê e faz parse de um valor JSON. Devolve `fallback` em qualquer erro. */
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[persist] falha ao ler ${key}:`, err);
    return fallback;
  }
}

/** Serializa e grava um valor JSON. Silencioso em caso de erro. */
export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[persist] falha ao gravar ${key}:`, err);
  }
}
