import * as Speech from 'expo-speech';
import { Language } from '../types';

/**
 * Audio Service - Handles text-to-speech for timer commands
 */
export class AudioService {
  private static instance: AudioService;
  private currentLanguage: Language;
  private isEnabled: boolean;
  private volume: number;

  private constructor() {
    this.currentLanguage = 'no';
    this.isEnabled = true;
    this.volume = 1.0;
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
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
      console.error('Error playing speech:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
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
      console.error('Error getting available voices:', error);
      return [];
    }
  }
}

// Export singleton instance
export default AudioService.getInstance();
