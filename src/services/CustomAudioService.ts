import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioService from './AudioService';
import logger from '../utils/logger';
import { Language } from '../types';
import { playUri, type PlayHandle } from '../utils/audioHelpers';

type Recording = Audio.Recording;

/**
 * CustomAudioService - User-Recorded Command Audio (Field Program Only)
 * 
 * RESPONSIBILITIES:
 * - Record custom audio clips for timer commands
 * - Play user-recorded audio instead of TTS
 * - Enable/disable custom audio per command phase
 * - Manage per-program, per-phase audio files
 * 
 * USE CASES:
 * - User records their own voice saying "KLAR!", "ILD!", "STAANS!"
 * - Toggle between custom audio and TTS per command
 * - Store recordings in app's document directory
 * 
 * SCOPE: Program-specific (currently only Field Program uses this)
 * 
 * STORAGE STRUCTURE:
 * - Files: {documentDirectory}/custom-audio/{programId}/{language}/{phaseKey}.m4a
 * - Metadata: AsyncStorage with keys like 'customAudio:enabled:{programId}:{language}:{phaseKey}'
 * - Enabled state: Per-phase toggle per language (true/false)
 * 
 * PHASES (PhaseKey):
 * - 'shooters_ready': Initial announcement "Er skytterne klare"
 * - 'ready_command': Prepare command "KLAR!"
 * - 'fire_command': Fire command "ILD!"
 * - 'cease_command': Cease fire command "STAANS!"
 * 
 * HYBRID APPROACH:
 * - Recording: expo-av (deprecated but functional, expo-audio requires hooks)
 * - Playback: expo-av Sound (compatible with recording)
 * 
 * Note: expo-audio's recording API requires React hooks (useAudioRecorder)
 * which can't be used in a service. We keep expo-av for recording until
 * a non-hook recording API is available.
 * 
 * NOT RESPONSIBLE FOR:
 * - TTS speech synthesis (see AudioService)
 * - PPC program stage recordings (see AudioClipService)
 * - System beeps (see AudioService)
 * 
 * RELATED SERVICES:
 * - AudioService: Provides TTS fallback when custom audio is disabled
 * - AudioClipService: Similar pattern but for PPC stage briefings
 */

const CUSTOM_AUDIO_DIR = `${Paths.document.uri}/custom-audio/`;

export type PhaseKey = 
  | 'shooters_ready'   // "Er skytterne klare" (initial announcement)
  | 'ready_command'    // "KLAR!" (prepare_warning start)
  | 'fire_command'     // "ILD!" (fire start)
  | 'cease_command';   // "STAANS!" (fire_warning)

const PHASE_LABELS: Record<PhaseKey, string> = {
  shooters_ready: 'Er skytterne klare',
  ready_command: 'KLAR!',
  fire_command: 'ILD!',
  cease_command: 'STAANS!',
};

const FALLBACK_LANGUAGE = 'no' as Language;

function resolveLanguage(language?: Language): Language {
  if (language) {
    return language;
  }

  try {
    return AudioService.getLanguage();
  } catch (error) {
    logger.warn('CustomAudioService: falling back to default language for custom audio', error);
    return FALLBACK_LANGUAGE;
  }
}

function getStorageKey(programId: string, phase: PhaseKey, language: Language): string {
  return `customAudio:enabled:${programId}:${language}:${phase}`;
}

function getLegacyStorageKey(programId: string, phase: PhaseKey): string {
  return `customAudio:enabled:${programId}:${phase}`;
}

function getOffsetKey(programId: string, phase: PhaseKey, language: Language): string {
  return `customAudio:offset:${programId}:${language}:${phase}`;
}

function getLegacyOffsetKey(programId: string, phase: PhaseKey): string {
  return `customAudio:offset:${programId}:${phase}`;
}

function getFilePath(programId: string, phase: PhaseKey, language: Language): string {
  return `${CUSTOM_AUDIO_DIR}${programId}/${language}/${phase}.m4a`;
}

function getLegacyFilePath(programId: string, phase: PhaseKey): string {
  return `${CUSTOM_AUDIO_DIR}${programId}/${phase}.m4a`;
}

async function ensureDirectories(programId: string, language: Language): Promise<void> {
  const baseDir = new Directory(CUSTOM_AUDIO_DIR);
  if (!baseDir.exists) {
    try {
      await baseDir.create();
    } catch (error: any) {
      if (!error?.message?.includes('already exists')) {
        logger.error('Failed to create base directory for custom audio:', error);
        throw error;
      }
    }
  }

  const programDirPath = `${CUSTOM_AUDIO_DIR}${programId}/`;
  const programDir = new Directory(programDirPath);
  if (!programDir.exists) {
    try {
      await programDir.create();
    } catch (error: any) {
      if (!error?.message?.includes('already exists')) {
        logger.error('Failed to create program directory for custom audio:', error);
        throw error;
      }
    }
  }

  const languageDirPath = `${programDirPath}${language}/`;
  const languageDir = new Directory(languageDirPath);
  if (!languageDir.exists) {
    try {
      await languageDir.create();
    } catch (error: any) {
      if (!error?.message?.includes('already exists')) {
        logger.error('Failed to create language directory for custom audio:', error);
        throw error;
      }
    }
  }
}

async function ensureRecordingPath(programId: string, phase: PhaseKey, language: Language): Promise<string | null> {
  const targetPath = getFilePath(programId, phase, language);
  const targetFile = new File(targetPath);
  if (targetFile.exists) {
    return targetPath;
  }

  const legacyPath = getLegacyFilePath(programId, phase);
  const legacyFile = new File(legacyPath);
  if (!legacyFile.exists) {
    return null;
  }

  try {
    await ensureDirectories(programId, language);
    await legacyFile.copy(targetFile);
    try {
      await legacyFile.delete();
    } catch (deleteError) {
      logger.warn('CustomAudioService: failed to remove legacy recording after migration', deleteError);
    }
    logger.info(`Migrated legacy custom audio recording to language-specific path: ${targetPath}`);
    return targetPath;
  } catch (error) {
    logger.error('CustomAudioService: failed to migrate legacy recording, continuing with legacy path', error);
    return legacyPath;
  }
}

// Global recorder and player instances
let currentRecording: Recording | null = null;
let playbackPlayers: Map<string, PlayHandle> = new Map();
const playbackDurations: Map<string, number> = new Map();

async function stopSound(key: string): Promise<void> {
  const handle = playbackPlayers.get(key);
  if (!handle) {
    return;
  }

  try {
    await handle.stop();
  } catch (error) {
    logger.warn(`Error stopping sound ${key}:`, error);
  }

  playbackPlayers.delete(key);
}

async function ensureAudioModeForRecording() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}

async function ensureAudioModeForPlayback() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}

/**
 * Get human-readable label for a phase
 */
export function getPhaseLabel(phase: PhaseKey): string {
  return PHASE_LABELS[phase] || phase;
}

/**
 * Get all available phases
 */
export function getAllPhases(): PhaseKey[] {
  return Object.keys(PHASE_LABELS) as PhaseKey[];
}

/**
 * Check if custom audio is enabled for a specific phase
 */
export async function isEnabled(programId: string, phase: PhaseKey, language?: Language): Promise<boolean> {
  const resolvedLanguage = resolveLanguage(language);
  const key = getStorageKey(programId, phase, resolvedLanguage);

  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value === 'true';
    }

    const legacyKey = getLegacyStorageKey(programId, phase);
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue !== null) {
      await AsyncStorage.setItem(key, legacyValue);
      await AsyncStorage.removeItem(legacyKey).catch(() => undefined);
      return legacyValue === 'true';
    }

    return false;
  } catch (error) {
    logger.error('CustomAudioService.isEnabled error:', error);
    return false;
  }
}

/**
 * Enable or disable custom audio for a specific phase
 */
export async function setEnabled(programId: string, phase: PhaseKey, enabled: boolean, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    await AsyncStorage.setItem(getStorageKey(programId, phase, resolvedLanguage), enabled ? 'true' : 'false');
    await AsyncStorage.removeItem(getLegacyStorageKey(programId, phase)).catch(() => undefined);
  } catch (error) {
    logger.error('CustomAudioService.setEnabled error:', error);
  }
}

/**
 * Get timing offset for a specific phase (in milliseconds, can be negative)
 * Positive = delay audio, Negative = play audio earlier
 */
export async function getOffset(programId: string, phase: PhaseKey, language?: Language): Promise<number> {
  const resolvedLanguage = resolveLanguage(language);
  const key = getOffsetKey(programId, phase, resolvedLanguage);

  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return parseInt(value, 10);
    }

    const legacyKey = getLegacyOffsetKey(programId, phase);
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue !== null) {
      await AsyncStorage.setItem(key, legacyValue);
      await AsyncStorage.removeItem(legacyKey).catch(() => undefined);
      return parseInt(legacyValue, 10);
    }

    return 0;
  } catch (error) {
    logger.error('CustomAudioService.getOffset error:', error);
    return 0;
  }
}

/**
 * Set timing offset for a specific phase (in milliseconds, can be negative)
 */
export async function setOffset(programId: string, phase: PhaseKey, offsetMs: number, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    await AsyncStorage.setItem(getOffsetKey(programId, phase, resolvedLanguage), offsetMs.toString());
    await AsyncStorage.removeItem(getLegacyOffsetKey(programId, phase)).catch(() => undefined);
  } catch (error) {
    logger.error('CustomAudioService.setOffset error:', error);
  }
}

/**
 * Check if a recording exists for a specific phase
 */
export async function hasRecording(programId: string, phase: PhaseKey, language?: Language): Promise<boolean> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    const path = await ensureRecordingPath(programId, phase, resolvedLanguage);
    if (!path) {
      return false;
    }
    const file = new File(path);
    return file.exists;
  } catch (error) {
    logger.error('CustomAudioService.hasRecording error:', error);
    return false;
  }
}

/**
 * Start recording for a specific phase
 * 
 * Note: expo-audio uses a class-based approach where AudioRecorder must be
 * imported and instantiated directly, not via dynamic import.
 */
export async function startRecording(programId: string, phase: PhaseKey): Promise<void> {
  try {
    await ensureAudioModeForRecording();
    
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Mikrofontillatelse avslått');
    }

    // Stop any existing recording
    if (currentRecording) {
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch (e) {
        logger.error('Error stopping previous recording:', e);
      }
      currentRecording = null;
    }

    // Use expo-av Recording (deprecated but functional)
    currentRecording = new Audio.Recording();
    await currentRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await currentRecording.startAsync();
    
    logger.log(`Recording started for ${programId}:${phase}`);
  } catch (error) {
    logger.error('CustomAudioService.startRecording error:', error);
    throw error;
  }
}

/**
 * Stop recording and save for a specific phase
 */
export async function stopRecording(programId: string, phase: PhaseKey, language?: Language): Promise<string | null> {
  if (!currentRecording) {
    logger.warn('No active recording to stop');
    return null;
  }

  const resolvedLanguage = resolveLanguage(language);

  try {
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    currentRecording = null;

    if (!uri) {
      logger.error('No URI from recording');
      return null;
    }

    await ensureDirectories(programId, resolvedLanguage);

    const targetPath = getFilePath(programId, phase, resolvedLanguage);
    const targetFile = new File(targetPath);
    
    // Delete existing file if present
    if (targetFile.exists) {
      await targetFile.delete();
    }
    
    // Copy from temp recording to permanent location
    const sourceFile = new File(uri);
    await sourceFile.copy(targetFile); // copy() takes File object in expo-file-system v19

    const playbackKey = `${programId}:${resolvedLanguage}:${phase}`;
    playbackDurations.delete(playbackKey);

    logger.log(`Recording saved to ${targetPath}`);
    return targetPath;
  } catch (error) {
    logger.error('CustomAudioService.stopRecording error:', error);
    currentRecording = null;
    throw error;
  }
}

/**
 * Cancel current recording without saving
 */
export async function cancelRecording(): Promise<void> {
  if (currentRecording) {
    try {
      await currentRecording.stopAndUnloadAsync();
    } catch (e) {
      logger.error('Error canceling recording:', e);
    }
    currentRecording = null;
  }
}

/**
 * Delete recording for a specific phase
 */
export async function deleteRecording(programId: string, phase: PhaseKey, language?: Language): Promise<void> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    const path = await ensureRecordingPath(programId, phase, resolvedLanguage);
    let deletedPath: string | null = null;

    if (path) {
      const file = new File(path);
      if (file.exists) {
        await file.delete();
        deletedPath = path;
      }
    }

    // Also clean up any legacy file if it still exists (e.g., migration failed earlier)
    const legacyPath = getLegacyFilePath(programId, phase);
    if (legacyPath !== path) {
      const legacyFile = new File(legacyPath);
      if (legacyFile.exists) {
        await legacyFile.delete();
        deletedPath = deletedPath ?? legacyPath;
      }
    }

    const key = `${programId}:${resolvedLanguage}:${phase}`;
    await stopSound(key);
    playbackDurations.delete(key);
    await setEnabled(programId, phase, false, resolvedLanguage);
    if (deletedPath) {
      logger.log(`Recording deleted: ${deletedPath}`);
    }
  } catch (error) {
    logger.error('CustomAudioService.deleteRecording error:', error);
  }
}

/**
 * Get duration of a recording in milliseconds
 */
export async function getRecordingDuration(programId: string, phase: PhaseKey, language?: Language): Promise<number> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    const path = await ensureRecordingPath(programId, phase, resolvedLanguage);
    if (!path) {
      return 0;
    }

    const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: false });
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        return status.durationMillis;
      }
      return 0;
    } finally {
      await sound.unloadAsync();
    }
  } catch (error) {
    logger.error('CustomAudioService.getRecordingDuration error:', error);
    return 0;
  }
}

/**
 * Play custom audio for a specific phase (if enabled and exists)
 * Returns duration in milliseconds if played, 0 otherwise
 */
export async function playIfEnabled(programId: string, phase: PhaseKey, language?: Language): Promise<number> {
  const resolvedLanguage = resolveLanguage(language);

  try {
    const enabled = await isEnabled(programId, phase, resolvedLanguage);
    if (!enabled) {
      return 0;
    }

    const path = await ensureRecordingPath(programId, phase, resolvedLanguage);
    if (!path) {
      logger.warn(`Custom audio enabled but file missing for ${programId}:${resolvedLanguage}:${phase}`);
      return 0;
    }

    await ensureAudioModeForPlayback();

    const key = `${programId}:${resolvedLanguage}:${phase}`;

    // Get timing offset for this phase
    const offset = await getOffset(programId, phase, resolvedLanguage);

    // Stop previous player for this phase
    await stopSound(key);

    // Note: Offset is handled in initializeTimer by adjusting step delays in the timing sequence
    // So we play immediately when called

    let handleForFinish: PlayHandle | null = null;
    const handle = await playUri({
      uri: path,
      onFinish: () => {
        if (playbackPlayers.get(key) === handleForFinish) {
          playbackPlayers.delete(key);
        }
      },
      onError: (error) => {
        logger.error('CustomAudioService.playIfEnabled playback error:', error);
        if (playbackPlayers.get(key) === handleForFinish) {
          playbackPlayers.delete(key);
        }
      },
    });

    if (!handle) {
      return 0;
    }

    handleForFinish = handle;
    playbackPlayers.set(key, handle);

    // Retrieve cached duration to avoid delaying playback; fetch asynchronously if missing
    let duration = playbackDurations.get(key) || 0;
    if (duration <= 0) {
      playbackDurations.set(key, -1); // mark fetch in progress
      getRecordingDuration(programId, phase, resolvedLanguage)
        .then((d) => {
          if (d > 0) {
            playbackDurations.set(key, d);
          } else {
            playbackDurations.delete(key);
          }
        })
        .catch((err) => {
          logger.error('CustomAudioService.getRecordingDuration async error:', err);
          playbackDurations.delete(key);
        });
      duration = 0;
    }

    const durationForLog = duration > 0 ? `${duration}ms` : 'pending';
    const returnDuration = duration > 0 ? duration : 1; // minimal positive value to signal custom audio active

    logger.log(
      `Playing custom audio: ${path} (duration: ${durationForLog}, offset: ${offset}ms applied in sequence)`
    );
    return returnDuration;
  } catch (error) {
    logger.error('CustomAudioService.playIfEnabled error:', error);
    return 0;
  }
}

/**
 * Stop all playback
 */
export async function stopAllPlayback(): Promise<void> {
  const keys = Array.from(playbackPlayers.keys());
  for (const key of keys) {
    await stopSound(key);
  }
}

/**
 * Get status for all phases of a program
 */
export async function getPhaseStatuses(
  programId: string,
  language?: Language,
): Promise<Record<PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }>> {
  const resolvedLanguage = resolveLanguage(language);
  const phases = getAllPhases();
  const statuses: Partial<Record<PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }>> = {};

  for (const phase of phases) {
    statuses[phase] = {
      enabled: await isEnabled(programId, phase, resolvedLanguage),
      hasFile: await hasRecording(programId, phase, resolvedLanguage),
      offset: await getOffset(programId, phase, resolvedLanguage),
    };
  }

  return statuses as Record<PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }>;
}

export default {
  getPhaseLabel,
  getAllPhases,
  isEnabled,
  setEnabled,
  getOffset,
  setOffset,
  hasRecording,
  getRecordingDuration,
  startRecording,
  stopRecording,
  cancelRecording,
  deleteRecording,
  playIfEnabled,
  stopAllPlayback,
  getPhaseStatuses,
};
