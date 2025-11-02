import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

type Recording = Audio.Recording;

/**
 * Custom Audio Service - Handles user-recorded audio per phase per program
 * 
 * Storage structure:
 * - Files: {documentDirectory}/custom-audio/{programId}/{phaseKey}.m4a
 * - AsyncStorage: customAudio:enabled:{programId}:{phaseKey} = 'true'|'false'
 * 
 * HYBRID APPROACH:
 * - Recording: Still using expo-av (deprecated but functional, expo-audio requires hooks)
 * - Playback: Using expo-audio's createAudioPlayer (new API)
 * 
 * Note: expo-audio's recording API requires React hooks (useAudioRecorder)
 * which can't be used in a service. We'll keep expo-av for recording until
 * a non-hook recording API is available.
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

// Global recorder and player instances
let currentRecording: Recording | null = null;
let playbackPlayers: Map<string, Audio.Sound> = new Map();
const playbackDurations: Map<string, number> = new Map();

async function stopSound(key: string): Promise<void> {
  const sound = playbackPlayers.get(key);
  if (!sound) {
    return;
  }

  try {
    await sound.stopAsync();
  } catch (error) {
    // Safe to ignore; sound might already be stopped
  }

  try {
    await sound.unloadAsync();
  } catch (error) {
    logger.error(`Error unloading sound ${key}:`, error);
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

function getStorageKey(programId: string, phase: PhaseKey): string {
  return `customAudio:enabled:${programId}:${phase}`;
}

function getOffsetKey(programId: string, phase: PhaseKey): string {
  return `customAudio:offset:${programId}:${phase}`;
}

function getFilePath(programId: string, phase: PhaseKey): string {
  return `${CUSTOM_AUDIO_DIR}${programId}/${phase}.m4a`;
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
export async function isEnabled(programId: string, phase: PhaseKey): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getStorageKey(programId, phase));
    return value === 'true';
  } catch (error) {
    logger.error('CustomAudioService.isEnabled error:', error);
    return false;
  }
}

/**
 * Enable or disable custom audio for a specific phase
 */
export async function setEnabled(programId: string, phase: PhaseKey, enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(getStorageKey(programId, phase), enabled ? 'true' : 'false');
  } catch (error) {
    logger.error('CustomAudioService.setEnabled error:', error);
  }
}

/**
 * Get timing offset for a specific phase (in milliseconds, can be negative)
 * Positive = delay audio, Negative = play audio earlier
 */
export async function getOffset(programId: string, phase: PhaseKey): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(getOffsetKey(programId, phase));
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    logger.error('CustomAudioService.getOffset error:', error);
    return 0;
  }
}

/**
 * Set timing offset for a specific phase (in milliseconds, can be negative)
 */
export async function setOffset(programId: string, phase: PhaseKey, offsetMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(getOffsetKey(programId, phase), offsetMs.toString());
  } catch (error) {
    logger.error('CustomAudioService.setOffset error:', error);
  }
}

/**
 * Check if a recording exists for a specific phase
 */
export async function hasRecording(programId: string, phase: PhaseKey): Promise<boolean> {
  try {
    const path = getFilePath(programId, phase);
    const file = new File(path);
    return file.exists;
  } catch (error) {
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
export async function stopRecording(programId: string, phase: PhaseKey): Promise<string | null> {
  if (!currentRecording) {
    logger.warn('No active recording to stop');
    return null;
  }

  try {
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    currentRecording = null;

    if (!uri) {
      logger.error('No URI from recording');
      return null;
    }

    // Ensure directories exist - create base dir first, then program-specific dir
    const baseDir = new Directory(CUSTOM_AUDIO_DIR);
    if (!baseDir.exists) {
      try {
        await baseDir.create();
        logger.log(`Created base directory: ${CUSTOM_AUDIO_DIR}`);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          logger.error('Failed to create base directory:', error);
          throw error;
        }
      }
    }
    
    const dirPath = `${CUSTOM_AUDIO_DIR}${programId}/`;
    const dir = new Directory(dirPath);
    if (!dir.exists) {
      try {
        await dir.create();
        logger.log(`Created program directory: ${dirPath}`);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          logger.error('Failed to create program directory:', error);
          throw error;
        }
      }
    }

    // Move to permanent location
    const targetPath = getFilePath(programId, phase);
    const targetFile = new File(targetPath);
    
    // Delete existing file if present
    if (targetFile.exists) {
      await targetFile.delete();
    }
    
    // Copy from temp recording to permanent location
    const sourceFile = new File(uri);
    await sourceFile.copy(targetFile); // copy() takes File object in expo-file-system v19

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
export async function deleteRecording(programId: string, phase: PhaseKey): Promise<void> {
  try {
    const path = getFilePath(programId, phase);
    const file = new File(path);
    if (file.exists) {
      await file.delete();
    }
    const key = `${programId}:${phase}`;
    await stopSound(key);
    playbackDurations.delete(key);
    await setEnabled(programId, phase, false);
    logger.log(`Recording deleted: ${path}`);
  } catch (error) {
    logger.error('CustomAudioService.deleteRecording error:', error);
  }
}

/**
 * Get duration of a recording in milliseconds
 */
export async function getRecordingDuration(programId: string, phase: PhaseKey): Promise<number> {
  try {
    const path = getFilePath(programId, phase);
    const file = new File(path);
    if (!file.exists) {
      return 0;
    }

    // Load audio with expo-av to get duration
    const { Audio } = require('expo-av');
    const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: false });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();

    if (status.isLoaded && status.durationMillis) {
      return status.durationMillis;
    }
    return 0;
  } catch (error) {
    logger.error('CustomAudioService.getRecordingDuration error:', error);
    return 0;
  }
}

/**
 * Play custom audio for a specific phase (if enabled and exists)
 * Returns duration in milliseconds if played, 0 otherwise
 */
export async function playIfEnabled(programId: string, phase: PhaseKey): Promise<number> {
  try {
    const enabled = await isEnabled(programId, phase);
    if (!enabled) {
      return 0;
    }

    const exists = await hasRecording(programId, phase);
    if (!exists) {
      logger.warn(`Custom audio enabled but file missing for ${programId}:${phase}`);
      return 0;
    }

    await ensureAudioModeForPlayback();

    const path = getFilePath(programId, phase);
    const key = `${programId}:${phase}`;

    // Get timing offset for this phase
    const offset = await getOffset(programId, phase);

    // Stop previous player for this phase
    await stopSound(key);

    // Note: Offset is handled in initializeTimer by adjusting step delays in the timing sequence
    // So we play immediately when called

    // Create and play with expo-av
    const { sound } = await Audio.Sound.createAsync(
      { uri: path },
      { shouldPlay: true },
      (status) => {
        const isFinished = (status as any)?.didJustFinish;
        if (isFinished) {
          stopSound(key);
        }
      }
    );
    playbackPlayers.set(key, sound);

    // Retrieve cached duration to avoid delaying playback; fetch asynchronously if missing
    let duration = playbackDurations.get(key) || 0;
    if (duration <= 0) {
      playbackDurations.set(key, -1); // mark fetch in progress
      getRecordingDuration(programId, phase)
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

    logger.log(`Playing custom audio: ${path} (duration: ${durationForLog}, offset: ${offset}ms applied in sequence)`);
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
export async function getPhaseStatuses(programId: string): Promise<Record<PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }>> {
  const phases = getAllPhases();
  const statuses: any = {};

  for (const phase of phases) {
    statuses[phase] = {
      enabled: await isEnabled(programId, phase),
      hasFile: await hasRecording(programId, phase),
      offset: await getOffset(programId, phase),
    };
  }

  return statuses;
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
