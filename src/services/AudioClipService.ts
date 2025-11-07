/**
 * AudioClipService
 * 
 * RESPONSIBILITIES:
 * - Manage audio clip metadata (AudioClipMeta) for PPC stage recordings
 * - Store/load/delete metadata using AsyncStorage
 * - Handle audio file storage in expo-file-system (document directory)
 * - Ensure clip directory exists before file operations
 * - List all saved audio clips by prefix/category
 * 
 * USE CASES:
 * - PPC stage briefing recordings (stage-specific instructions)
 * - PPC stage title/name recordings (custom stage identification)
 * - Any user-recorded audio associated with PPC stages
 * 
 * SCOPE:
 * - PPC (Precision Pistol Competition) program only
 * - Metadata-level management (not recording/playback logic)
 * - Used primarily by PpcHomeScreen for stage configuration
 * 
 * STORAGE STRUCTURE:
 * - AsyncStorage keys: "@audioClip:{key}" → AudioClipMeta JSON
 * - File system: {documentDirectory}/audio-clips/{key}.m4a
 * - Metadata includes: key, uri, createdAt, durationMs
 * 
 * KEY DIFFERENCE FROM CustomAudioService:
 * - CustomAudioService: Full recording service for Field program commands (4 phases)
 * - AudioClipService: Metadata-only service for PPC stage recordings (multiple stages)
 * - CustomAudioService: Hardcoded phase keys (PhaseKey enum)
 * - AudioClipService: Flexible string keys (stage IDs, briefing/title categories)
 * 
 * NOT RESPONSIBLE FOR:
 * - Recording audio (handled by expo-av in UI components)
 * - Playing audio (handled by AudioService or expo-av directly)
 * - Field program custom audio (see CustomAudioService)
 * 
 * RELATED SERVICES:
 * - Used by PpcHomeScreen for managing stage-specific recordings
 * - Similar pattern to CustomAudioService but for different program type
 * - Files stored separately from custom-audio directory
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import logger from '../utils/logger';

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
    logger.warn('Failed to load audio clip metadata', error);
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
      logger.warn('Failed to clean up existing clip before saving', cleanupError);
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
    logger.warn('Failed to move recorded clip, keeping source location', error);
    // If move fails, we still have the file at recordingUri
    // Save metadata pointing to original location
    await saveClipMeta(fallbackMeta);
    return fallbackMeta;
  }
}

export async function deleteClip(key: string): Promise<void> {
  const meta = await loadClipMeta(key);
  if (meta?.uri) {
    try {
      await FileSystem.deleteAsync(meta.uri);
    } catch (error) {
      logger.warn('Failed to delete audio file for clip', error);
    }
  }
  await AsyncStorage.removeItem(key);
}