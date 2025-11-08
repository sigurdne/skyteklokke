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
import AudioService from './AudioService';
import logger from '../utils/logger';
import { Language } from '../types';

export interface AudioClipMeta {
  key: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
  language: Language;
}

type StoredAudioClipMeta = {
  key?: string;
  uri?: string;
  createdAt?: number;
  durationMs?: number;
  language?: Language;
};

const STORAGE_PREFIX = '@audioClip:';
const FALLBACK_LANGUAGE: Language = 'no';
const DOCUMENT_DIRECTORY: string | null = (FileSystem as any).documentDirectory ?? null;
const CACHE_DIRECTORY: string | null = (FileSystem as any).cacheDirectory ?? null;
const CLIP_ROOT = DOCUMENT_DIRECTORY ?? CACHE_DIRECTORY;
const CLIP_DIRECTORY = CLIP_ROOT ? `${CLIP_ROOT}audio-clips/` : null;

function resolveLanguage(language?: Language): Language {
  if (language) {
    return language;
  }

  try {
    return AudioService.getLanguage();
  } catch (error) {
    logger.warn('AudioClipService: falling back to default language', error);
    return FALLBACK_LANGUAGE;
  }
}

function composeStorageKey(key: string, language: Language): string {
  return `${STORAGE_PREFIX}${language}:${key}`;
}

function composeLegacyStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function normalizeMeta(
  meta: StoredAudioClipMeta | null,
  key: string,
  language: Language,
  uriFallback?: string,
): AudioClipMeta {
  const resolvedLanguage = meta?.language ?? language;
  const createdAt = typeof meta?.createdAt === 'number' ? meta.createdAt : Date.now();
  const durationMs = typeof meta?.durationMs === 'number' ? meta.durationMs : undefined;
  const uri = typeof meta?.uri === 'string' && meta.uri.length > 0 ? meta.uri : uriFallback ?? '';

  return {
    key,
    uri,
    createdAt,
    durationMs,
    language: resolvedLanguage,
  };
}

async function removeLegacyMeta(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(composeLegacyStorageKey(key));
  } catch {
    // Best effort cleanup only
  }
}

async function ensureLanguageDirectory(language: Language): Promise<string> {
  if (!CLIP_DIRECTORY) {
    throw new Error('FileSystem directory unavailable for audio clips');
  }

  const languageDir = `${CLIP_DIRECTORY}${language}/`;

  try {
    const rootInfo = await FileSystem.getInfoAsync(CLIP_DIRECTORY);
    if (!rootInfo.exists) {
      await FileSystem.makeDirectoryAsync(CLIP_DIRECTORY, { intermediates: true });
    }
  } catch (error) {
    logger.warn('AudioClipService: failed to ensure base clip directory', error);
    throw error;
  }

  try {
    const languageInfo = await FileSystem.getInfoAsync(languageDir);
    if (!languageInfo.exists) {
      await FileSystem.makeDirectoryAsync(languageDir, { intermediates: true });
    }
  } catch (error) {
    logger.warn('AudioClipService: failed to ensure language clip directory', error);
    throw error;
  }

  return languageDir;
}

async function removeIfExists(uri: string): Promise<void> {
  try {
    const existing = await FileSystem.getInfoAsync(uri);
    if (existing.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    logger.warn('AudioClipService: failed to remove existing clip before save', error);
  }
}

async function migrateLegacyMeta(
  key: string,
  legacyMeta: StoredAudioClipMeta,
  language: Language,
): Promise<AudioClipMeta> {
  const normalized = normalizeMeta(legacyMeta, key, language);

  if (!normalized.uri) {
    const sanitized = { ...normalized, language };
    await saveClipMeta(sanitized, language);
    await removeLegacyMeta(key);
    return sanitized;
  }

  if (!CLIP_DIRECTORY) {
    await saveClipMeta(normalized, language);
    await removeLegacyMeta(key);
    return normalized;
  }

  let finalUri = normalized.uri;

  try {
    const languageDir = await ensureLanguageDirectory(language);
    const targetUri = `${languageDir}${key}.m4a`;

    if (normalized.uri !== targetUri) {
      const info = await FileSystem.getInfoAsync(normalized.uri);
      if (info.exists) {
        await removeIfExists(targetUri);
        await FileSystem.moveAsync({ from: normalized.uri, to: targetUri });
        finalUri = targetUri;
      }
    }
  } catch (error) {
    logger.warn('AudioClipService: failed to migrate legacy clip to language path', error);
    finalUri = normalized.uri;
  }

  const migratedMeta = normalizeMeta(
    { ...normalized, uri: finalUri, language },
    key,
    language,
    finalUri,
  );

  await saveClipMeta(migratedMeta, language);
  await removeLegacyMeta(key);
  return migratedMeta;
}

export async function loadClipMeta(key: string, language?: Language): Promise<AudioClipMeta | null> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    const stored = await AsyncStorage.getItem(composeStorageKey(key, resolvedLanguage));
    if (stored) {
      const parsed = JSON.parse(stored) as StoredAudioClipMeta;
      return normalizeMeta(parsed, key, resolvedLanguage);
    }

    const legacyStored = await AsyncStorage.getItem(composeLegacyStorageKey(key));
    if (!legacyStored) {
      return null;
    }

    const legacyMeta = JSON.parse(legacyStored) as StoredAudioClipMeta;
    return await migrateLegacyMeta(key, legacyMeta, resolvedLanguage);
  } catch (error) {
    logger.warn('Failed to load audio clip metadata', error);
    return null;
  }
}

export async function saveClipMeta(meta: AudioClipMeta, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language ?? meta.language);
  const normalized = normalizeMeta(meta, meta.key, resolvedLanguage, meta.uri);
  const storageKey = composeStorageKey(normalized.key, resolvedLanguage);

  await AsyncStorage.setItem(storageKey, JSON.stringify(normalized));
  await removeLegacyMeta(normalized.key);
}

export async function removeClipMeta(key: string, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);
  await AsyncStorage.removeItem(composeStorageKey(key, resolvedLanguage));
  await removeLegacyMeta(key);
}

export async function moveRecordingToLibrary(
  key: string,
  sourceUri: string,
  durationMs?: number,
  language?: Language,
): Promise<AudioClipMeta> {
  const resolvedLanguage = resolveLanguage(language);

  const fallbackMeta = normalizeMeta(
    { uri: sourceUri, durationMs, createdAt: Date.now(), language: resolvedLanguage },
    key,
    resolvedLanguage,
    sourceUri,
  );

  if (!CLIP_DIRECTORY) {
    await saveClipMeta(fallbackMeta, resolvedLanguage);
    return fallbackMeta;
  }

  try {
    const languageDir = await ensureLanguageDirectory(resolvedLanguage);
    const targetUri = `${languageDir}${key}.m4a`;

    await removeIfExists(targetUri);
    await FileSystem.moveAsync({ from: sourceUri, to: targetUri });

    const meta = normalizeMeta(
      { uri: targetUri, durationMs, createdAt: Date.now(), language: resolvedLanguage },
      key,
      resolvedLanguage,
      targetUri,
    );

    await saveClipMeta(meta, resolvedLanguage);
    return meta;
  } catch (error) {
    logger.warn('Failed to move recorded clip, keeping source location', error);
    await saveClipMeta(fallbackMeta, resolvedLanguage);
    return fallbackMeta;
  }
}

export async function deleteClip(key: string, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);
  const meta = await loadClipMeta(key, resolvedLanguage);

  if (meta?.uri) {
    try {
      await FileSystem.deleteAsync(meta.uri, { idempotent: true });
    } catch (error) {
      logger.warn('Failed to delete audio file for clip', error);
    }
  }

  await removeClipMeta(key, resolvedLanguage);
}