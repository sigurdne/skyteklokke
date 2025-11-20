import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioService from './AudioService';
import logger from '../utils/logger';
import { Language } from '../types';
import { playUri, type PlayHandle } from '../utils/audioHelpers';

// Types
export interface RecordingMetadata {
  id: string;
  category: string;
  language: Language;
  uri: string;
  durationMs?: number;
  createdAt: number;
  enabled?: boolean;
  offsetMs?: number;
}

export type RecordingCategory = 'field-command' | 'ppc-clip';

// Constants
const RECORDINGS_DIR = `${Paths.document.uri}/user-recordings/`;
const STORAGE_PREFIX = '@userRecording:';
const FALLBACK_LANGUAGE: Language = 'no';

// Helper Functions
function resolveLanguage(language?: Language): Language {
  if (language) {
    return language;
  }
  try {
    return AudioService.getLanguage();
  } catch (error) {
    return FALLBACK_LANGUAGE;
  }
}

function getStorageKey(category: string, id: string, language: Language): string {
  return `${STORAGE_PREFIX}${category}:${language}:${id}`;
}

function getFilePath(category: string, id: string, language: Language): string {
  // Sanitize ID to be safe for filenames
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${RECORDINGS_DIR}${category}/${language}/${safeId}.m4a`;
}

async function ensureDirectory(path: string): Promise<void> {
  const dir = new Directory(path);
  if (!dir.exists) {
    await dir.create();
  }
}

// Service Class
class UserRecordingService {
  private currentRecording: Audio.Recording | null = null;
  private playbackPlayers: Map<string, PlayHandle> = new Map();

  // --- Metadata & Storage ---

  async saveMetadata(meta: RecordingMetadata): Promise<void> {
    const key = getStorageKey(meta.category, meta.id, meta.language);
    await AsyncStorage.setItem(key, JSON.stringify(meta));
  }

  async getMetadata(category: string, id: string, language?: Language): Promise<RecordingMetadata | null> {
    const lang = resolveLanguage(language);
    const key = getStorageKey(category, id, lang);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async deleteMetadata(category: string, id: string, language?: Language): Promise<void> {
    const lang = resolveLanguage(language);
    const key = getStorageKey(category, id, lang);
    await AsyncStorage.removeItem(key);
  }

  async getAllMetadata(category?: string): Promise<RecordingMetadata[]> {
    const keys = await AsyncStorage.getAllKeys();
    const recordingKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    const results: RecordingMetadata[] = [];

    for (const key of recordingKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const meta = JSON.parse(data) as RecordingMetadata;
        if (!category || meta.category === category) {
          results.push(meta);
        }
      }
    }
    return results;
  }

  // --- File Management ---

  async saveRecordingFile(sourceUri: string, category: string, id: string, language?: Language): Promise<string> {
    const lang = resolveLanguage(language);
    const targetPath = getFilePath(category, id, lang);
    
    // Ensure directories exist
    const categoryDir = `${RECORDINGS_DIR}${category}/`;
    const langDir = `${categoryDir}${lang}/`;
    
    await ensureDirectory(RECORDINGS_DIR);
    await ensureDirectory(categoryDir);
    await ensureDirectory(langDir);

    // Move/Copy file
    const sourceFile = new File(sourceUri);
    const targetFile = new File(targetPath);

    if (targetFile.exists) {
      await targetFile.delete();
    }

    if (sourceFile.exists) {
      await sourceFile.copy(targetFile);
      // Try to delete source if it's a temp file, but don't fail if we can't
      try {
        if (sourceUri.includes('cache') || sourceUri.includes('AV/')) {
           await sourceFile.delete();
        }
      } catch (e) {
        logger.warn('Failed to delete temp recording file', e);
      }
    } else {
      throw new Error(`Source file not found: ${sourceUri}`);
    }

    return targetPath;
  }

  async deleteRecording(category: string, id: string, language?: Language): Promise<void> {
    const lang = resolveLanguage(language);
    const meta = await this.getMetadata(category, id, lang);
    
    if (meta) {
      const file = new File(meta.uri);
      if (file.exists) {
        await file.delete();
      }
      await this.deleteMetadata(category, id, lang);
    }
  }

  // --- Recording Logic ---

  async startRecording(): Promise<void> {
    if (this.currentRecording) {
      await this.stopRecording();
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Missing audio recording permissions.');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.currentRecording = recording;
    } catch (error) {
      logger.error('Failed to start recording', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; durationMs: number }> {
    if (!this.currentRecording) {
      throw new Error('No active recording');
    }

    try {
      await this.currentRecording.stopAndUnloadAsync();
      const uri = this.currentRecording.getURI();
      const status = await this.currentRecording.getStatusAsync();
      const durationMs = status.durationMillis;

      this.currentRecording = null;

      if (!uri) {
        throw new Error('Recording produced no URI');
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      return { uri, durationMs };
    } catch (error) {
      logger.error('Failed to stop recording', error);
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.currentRecording) {
      try {
        await this.currentRecording.stopAndUnloadAsync();
      } catch (e) {
        // Ignore
      }
      this.currentRecording = null;
    }
  }

  // --- Playback Logic ---

  async playRecording(category: string, id: string, language?: Language): Promise<PlayHandle | null> {
    const lang = resolveLanguage(language);
    const meta = await this.getMetadata(category, id, lang);

    if (!meta || !meta.uri) {
      logger.warn(`No recording found for ${category}:${id}:${lang}`);
      return null;
    }

    // Stop existing playback for this ID if any
    await this.stopPlayback(category, id);

    try {
      const handle = await playUri({ uri: meta.uri });
      if (handle) {
        const key = `${category}:${id}`;
        this.playbackPlayers.set(key, handle);
        return handle;
      }
      return null;
    } catch (error) {
      logger.error('Failed to play recording', error);
      return null;
    }
  }

  async stopPlayback(category: string, id: string): Promise<void> {
    const key = `${category}:${id}`;
    const handle = this.playbackPlayers.get(key);
    if (handle) {
      await handle.stop();
      this.playbackPlayers.delete(key);
    }
  }

  // --- Migration Helpers ---
  
  // This can be called by the app on startup or when accessing legacy features
  async migrateLegacyCustomAudio(programId: string, phase: string, language: Language): Promise<void> {
    // Legacy path: custom-audio/{programId}/{language}/{phase}.m4a
    const legacyPath = `${Paths.document.uri}/custom-audio/${programId}/${language}/${phase}.m4a`;
    const legacyFile = new File(legacyPath);
    
    if (legacyFile.exists) {
      logger.info(`Migrating legacy custom audio: ${programId}/${phase}`);
      
      // Check for legacy metadata (enabled/offset)
      const enabledKey = `customAudio:enabled:${programId}:${language}:${phase}`;
      const offsetKey = `customAudio:offset:${programId}:${language}:${phase}`;
      
      const enabledStr = await AsyncStorage.getItem(enabledKey);
      const offsetStr = await AsyncStorage.getItem(offsetKey);
      
      const enabled = enabledStr === 'true';
      const offsetMs = offsetStr ? parseInt(offsetStr, 10) : 0;
      
      const category = 'field-command';
      const id = `${programId}_${phase}`; // Composite ID
      
      const newPath = await this.saveRecordingFile(legacyPath, category, id, language);
      
      const meta: RecordingMetadata = {
        id,
        category,
        language,
        uri: newPath,
        createdAt: Date.now(), // Unknown
        enabled,
        offsetMs
      };
      
      await this.saveMetadata(meta);
      
      // Cleanup legacy
      // await legacyFile.delete(); // Keep for safety for now? Or delete?
      // await AsyncStorage.removeItem(enabledKey);
      // await AsyncStorage.removeItem(offsetKey);
    }
  }
}

export default new UserRecordingService();
