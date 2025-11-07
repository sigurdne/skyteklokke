import { Audio } from 'expo-av';
import logger from './logger';

/**
 * Lightweight reusable helpers for one-off sound playback with expo-av.
 * Centralizes creation + status observer + auto-unload to reduce duplication across screens.
 */
export interface PlayOptions {
  /** URI to play (file:// or data: URI). */
  uri: string;
  /** Optional volume (0-1). */
  volume?: number;
  /** Called when playback finishes (success or early stop). */
  onFinish?: () => void;
  /** Called if sound could not be loaded/played. */
  onError?: (error: unknown) => void;
}

export interface PlayHandle {
  stop: () => Promise<void>;
  sound: Audio.Sound;
}

/**
 * Play a single URI and unload automatically when finished.
 * Returns a handle allowing manual stop.
 */
export async function playUri(options: PlayOptions): Promise<PlayHandle | null> {
  const { uri, volume = 1.0, onFinish, onError } = options;
  if (!uri) {
    return null;
  }
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish || (!status.isPlaying && status.positionMillis > 0)) {
        sound.unloadAsync().catch(() => undefined);
        onFinish?.();
      }
    });
    return {
      sound,
      stop: async () => {
        try {
          await sound.stopAsync();
        } catch (e) {
          logger.warn('playUri.stop: stopAsync failed', e);
        }
        try {
          await sound.unloadAsync();
        } catch (e) {
          logger.warn('playUri.stop: unloadAsync failed', e);
        }
        onFinish?.();
      }
    };
  } catch (error) {
    logger.warn('playUri: failed to start playback', error);
    onError?.(error);
    return null;
  }
}

/** Stop & unload a sound safely (null-safe). */
export async function stopAndUnload(soundRef: Audio.Sound | null): Promise<void> {
  if (!soundRef) return;
  try {
    await soundRef.stopAsync();
  } catch (e) {
    // ignore
  }
  try {
    await soundRef.unloadAsync();
  } catch (e) {
    // ignore
  }
}

/** Guard pattern for replacing existing sound with new playback. */
export async function replacePlayback(current: Audio.Sound | null, uri: string, opts?: Omit<PlayOptions,'uri'>): Promise<PlayHandle | null> {
  await stopAndUnload(current);
  return playUri({ uri, ...opts });
}

export default {
  playUri,
  stopAndUnload,
  replacePlayback,
};