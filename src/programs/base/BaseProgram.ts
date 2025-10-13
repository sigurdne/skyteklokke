import { 
  ProgramConfig, 
  ProgramSettings, 
  TimingStep, 
  UIConfig, 
  AudioConfig,
  Language 
} from '../../types';

/**
 * Abstract base class for all shooting programs
 * All shooting programs must extend this class and implement the abstract methods
 */
export abstract class BaseProgram {
  protected config: ProgramConfig;
  protected settings: ProgramSettings;

  constructor(config: ProgramConfig) {
    this.config = config;
    this.settings = { ...config.defaultSettings };
  }

  // Getters for program properties
  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get category(): string {
    return this.config.category;
  }

  get type(): string {
    return this.config.type;
  }

  get supportedLanguages(): Language[] {
    return this.config.supportedLanguages;
  }

  // Abstract methods that must be implemented by subclasses
  abstract getStates(): { [key: string]: string };
  abstract getCommands(): string[];
  abstract getTimingSequence(): TimingStep[];
  abstract validateSettings(settings: ProgramSettings): boolean;

  // Default implementations that can be overridden
  getUIConfig(): UIConfig {
    return {
      backgroundColor: '#FFFFFF',
      textColor: '#2C3E50',
      showTimer: true,
      showCommand: true,
      fullscreen: false,
    };
  }

  getAudioConfig(): AudioConfig {
    return {
      enabled: true,
      volume: 1.0,
      language: 'no',
    };
  }

  // Settings management
  getSettings(): ProgramSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<ProgramSettings>): void {
    const updatedSettings = { ...this.settings, ...newSettings };
    if (this.validateSettings(updatedSettings)) {
      this.settings = updatedSettings;
    } else {
      throw new Error('Invalid settings for program');
    }
  }

  resetSettings(): void {
    this.settings = { ...this.config.defaultSettings };
  }

  // Utility methods
  supportsLanguage(language: Language): boolean {
    return this.supportedLanguages.includes(language);
  }

  getTotalDuration(): number {
    const sequence = this.getTimingSequence();
    return sequence.reduce((total, step) => total + step.delay, 0);
  }
}
