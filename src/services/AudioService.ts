import * as Speech from 'expo-speech';
import logger from '../utils/logger';
import { Language } from '../types';

/**
 * Audio Service - Handles text-to-speech for timer commands
 */
export class AudioService {
  private static instance: AudioService;
  private currentLanguage: Language;
  private isEnabled: boolean;
  private volume: number;
  private isWarmedUp: boolean = false;

  private constructor() {
    this.currentLanguage = 'no';
    this.isEnabled = true;
    this.volume = 1.0;
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

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
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
   * Play system beep sound for training mode
   * Uses a synthesized beep sound with TTS
   */
  playBeep(continuous: boolean = false): void {
  logger.log('🔊 playBeep called, continuous:', continuous);
    
    try {
      // Use a very short, high-pitched vowel sound that sounds like a beep
      // Continuous beep is longer with 11 bips and slower rate to cover full 2 seconds
      const beepSound = continuous ? 'bip bip bip bip bip bip bip bip bip bip bip' : 'bip';
      
  logger.log('🔊 Playing beep:', beepSound);
      
      // Speech.speak doesn't return a promise, just call it
      Speech.speak(beepSound, {
        language: 'en-US',
        pitch: 2.0,  // Very high pitch
        rate: continuous ? 1.3 : 3.0,  // Even slower for continuous to make it last 2 seconds
        volume: this.volume,
      });
      
      logger.log('🔊 Beep started');
    } catch (error) {
      logger.error('❌ Error in playBeep:', error);
    }
  }
}

// Export singleton instance
export default AudioService.getInstance();
