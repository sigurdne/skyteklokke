import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import logger from './logger';

/**
 * Lightweight reusable helpers for one-off sound playback with expo-audio.
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
  player: AudioPlayer;
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
  let player: AudioPlayer | null = null;
  let subscription: { remove: () => void } | null = null;
  let finished = false;

  const finish = (error?: unknown) => {
    if (finished) return;
    finished = true;
    subscription?.remove();
    player?.remove();
    if (error !== undefined) {
      onError?.(error);
    } else {
      onFinish?.();
    }
  };

  try {
    player = createAudioPlayer({ uri }, { updateInterval: 100 });
    player.volume = volume;
    subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.error) {
        finish(status.error);
      } else if (status.didJustFinish) {
        finish();
      }
    });
    player.play();
    return {
      player,
      stop: async () => {
        if (finished) return;
        player?.pause();
        finish();
      },
    };
  } catch (error) {
    player?.remove();
    logger.warn('playUri: failed to start playback', error);
    onError?.(error);
    return null;
  }
}

/** Stop & unload a sound safely (null-safe). */
export default {
  playUri,
};