import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { Language } from '../types';

/**
 * AudioService - Text-to-Speech (TTS) for Timer Commands
 * 
 * RESPONSIBILITIES:
 * - Convert text commands to speech using expo-speech
 * - Play system beep sounds for countdowns
 * - Manage TTS language selection (no, en, sv, da)
 * - Control volume and speech rate
 * 
 * USE CASES:
 * - Speaking timer commands like "KLAR!", "ILD!", "STAANS!"
 * - Playing countdown beeps (single or continuous)
 * - System-wide language changes
 * 
 * SCOPE: Global singleton service used across all timer programs
 * 
 * NOT RESPONSIBLE FOR:
 * - User-recorded audio (see CustomAudioService)
 * - Audio file metadata (see AudioClipService)
 * - Program-specific audio logic (handled by adapters)
 * 
 * RELATED SERVICES:
 * - CustomAudioService: Handles user-recorded command audio
 * - AudioClipService: Manages audio file storage and metadata
 */
export class AudioService {
  private static instance: AudioService;
  private currentLanguage: Language;
  private isEnabled: boolean;
  private volume: number;
  private isWarmedUp: boolean = false;
  private cachedHornDataUrl: string | null = null; // cache generated horn beep
  private static AUDIO_ENABLED_KEY = '@audio_enabled';

  private constructor() {
    this.currentLanguage = 'no';
    this.isEnabled = true;
    this.volume = 1.0;
    // Load audio enabled state from storage
    this.loadAudioEnabledState();
    // Warm up TTS system immediately to avoid delay on first beep
    this.warmUpTTS();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Warm up the TTS system by playing a silent beep
   * This prevents the delay on the first real beep after app start
   */
  private async warmUpTTS(): Promise<void> {
    if (this.isWarmedUp) return;
    
    try {
      logger.log('🔥 Warming up TTS system...');
      // Play a very short, nearly inaudible sound to initialize the TTS engine
      // Using space character and very fast rate to make it imperceptible
      await Speech.speak(' ', {
        language: 'en-US',
        pitch: 0.5,
        rate: 4.0, // Maximum speed
        volume: 0.001, // Nearly zero volume
      });
      this.isWarmedUp = true;
      logger.log('✅ TTS system warmed up');
    } catch (error) {
      logger.error('❌ Error warming up TTS:', error);
    }
  }

  private async loadAudioEnabledState(): Promise<void> {
    try {
      const value = await AsyncStorage.getItem(AudioService.AUDIO_ENABLED_KEY);
      if (value !== null) {
        this.isEnabled = value === 'true';
      }
    } catch (error) {
      logger.error('Error loading audio enabled state:', error);
    }
  }

  private async saveAudioEnabledState(): Promise<void> {
    try {
      await AsyncStorage.setItem(AudioService.AUDIO_ENABLED_KEY, String(this.isEnabled));
    } catch (error) {
      logger.error('Error saving audio enabled state:', error);
    }
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveAudioEnabledState();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  }

  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // Stop any ongoing speech
    await this.stop();

    const language = this.getLanguageCode(this.currentLanguage);

    const speechOptions: Speech.SpeechOptions = {
      language,
      pitch: 1.0,
      rate: 0.9, // Slightly slower for clarity
      volume: this.volume,
      ...options,
    };

    try {
      await Speech.speak(text, speechOptions);
    } catch (error) {
      logger.error('Error playing speech:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch (error) {
      logger.error('Error stopping speech:', error);
    }
  }

  private getLanguageCode(language: Language): string {
    const languageMap: Record<Language, string> = {
      no: 'no-NO',
      en: 'en-US',
      sv: 'sv-SE',
      da: 'da-DK',
    };
    return languageMap[language] || 'no-NO';
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      logger.error('Error getting available voices:', error);
      return [];
    }
  }

  /**
   * Generate a loud horn-like beep sound (0.3 seconds)
   * Creates a train horn effect using two frequencies
   */
  private generateHornBeep(): string {
    if (this.cachedHornDataUrl) {
      return this.cachedHornDataUrl;
    }
    // Generate a WAV file data URL with a train horn sound
    const sampleRate = 44100;
    const duration = 0.3; // 300ms
    const numSamples = Math.floor(sampleRate * duration);
    
    // Create WAV buffer
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    // Generate horn sound: two frequencies (220Hz and 330Hz) for train horn effect
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Envelope: fade in quickly, sustain, fade out
      const envelope = t < 0.05 ? t / 0.05 : t > 0.25 ? (0.3 - t) / 0.05 : 1.0;
      
      // Two sine waves for train horn effect
      const freq1 = 220; // A3
      const freq2 = 330; // E4
      const sample1 = Math.sin(2 * Math.PI * freq1 * t);
      const sample2 = Math.sin(2 * Math.PI * freq2 * t);
      
      // Mix and apply envelope, scale to 16-bit range with doubled volume
      const value = Math.floor((sample1 + sample2) * 0.5 * envelope * 32767 * this.volume * 2.0);
      view.setInt16(44 + i * 2, value, true);
    }
    
    // Convert to base64 data URL
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:audio/wav;base64,${base64}`;
    this.cachedHornDataUrl = dataUrl;
    return dataUrl;
  }

  /**
   * Play system beep sound for training mode
   * Generates a loud train horn-like sound (0.3 seconds)
   */
  async playBeep(continuous: boolean = false): Promise<void> {
    logger.log('🔊 playBeep called, continuous:', continuous);
    
    try {
      const hornSound = this.generateHornBeep();
      
      if (continuous) {
        // Play multiple beeps with gaps for continuous mode
        logger.log('🔊 Playing continuous horn beeps');
        for (let i = 0; i < 5; i++) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: hornSound },
            { shouldPlay: true, volume: this.volume }
          );
          await new Promise(resolve => setTimeout(resolve, 400)); // 300ms beep + 100ms gap
          await sound.unloadAsync();
        }
      } else {
        // Single beep
        logger.log('🔊 Playing single horn beep');
        const { sound } = await Audio.Sound.createAsync(
          { uri: hornSound },
          { shouldPlay: true, volume: this.volume }
        );
        
        // Auto-cleanup after playing
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (err) {
            // Ignore cleanup errors
          }
        }, 500);
      }
      
      logger.log('🔊 Horn beep started');
    } catch (error) {
      logger.error('❌ Error in playBeep:', error);
    }
  }
}

// Export singleton instance
export default AudioService.getInstance();
