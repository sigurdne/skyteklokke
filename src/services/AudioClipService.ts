import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface AudioClipMeta {
  key: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
}

const STORAGE_PREFIX = '@audioClip:';
const DOCUMENT_DIRECTORY: string | null = (FileSystem as any).documentDirectory ?? null;
const CACHE_DIRECTORY: string | null = (FileSystem as any).cacheDirectory ?? null;
const CLIP_ROOT = DOCUMENT_DIRECTORY ?? CACHE_DIRECTORY;
const CLIP_DIRECTORY = CLIP_ROOT ? `${CLIP_ROOT}audio-clips/` : null;

export async function loadClipMeta(key: string): Promise<AudioClipMeta | null> {
  try {
    const stored = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as AudioClipMeta;
    return parsed;
  } catch (error) {
    console.warn('Failed to load audio clip metadata', error);
    return null;
  }
}

export async function saveClipMeta(meta: AudioClipMeta): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_PREFIX}${meta.key}`, JSON.stringify(meta));
}

export async function removeClipMeta(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

export async function ensureClipDirectory(): Promise<void> {
  if (!CLIP_DIRECTORY) {
    throw new Error('FileSystem directory unavailable for audio clips');
  }
  const info = await FileSystem.getInfoAsync(CLIP_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CLIP_DIRECTORY, { intermediates: true });
  }
}

export async function moveRecordingToLibrary(key: string, sourceUri: string, durationMs?: number): Promise<AudioClipMeta> {
  const fallbackMeta: AudioClipMeta = {
    key,
    uri: sourceUri,
    createdAt: Date.now(),
    durationMs,
  };

  if (!CLIP_DIRECTORY) {
    await saveClipMeta(fallbackMeta);
    return fallbackMeta;
  }

  const targetUri = `${CLIP_DIRECTORY}${key}.m4a`;

  try {
    await ensureClipDirectory();

    try {
      const existing = await FileSystem.getInfoAsync(targetUri);
      if (existing.exists) {
        await FileSystem.deleteAsync(targetUri, { idempotent: true });
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up existing clip before saving', cleanupError);
    }

    await FileSystem.moveAsync({ from: sourceUri, to: targetUri });

    const meta: AudioClipMeta = {
      key,
      uri: targetUri,
      createdAt: Date.now(),
      durationMs,
    };

    await saveClipMeta(meta);
    return meta;
  } catch (error) {
    console.warn('Failed to move recorded clip, keeping source location', error);
    await saveClipMeta(fallbackMeta);
    return fallbackMeta;
  }
}

export async function deleteClip(key: string): Promise<void> {
  const meta = await loadClipMeta(key);
  if (meta?.uri) {
    try {
      await FileSystem.deleteAsync(meta.uri, { idempotent: true });
    } catch (error) {
      console.warn('Failed to delete audio file for clip', error);
    }
  }
  await removeClipMeta(key);
}
