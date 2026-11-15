export type ProgramCategory = 'field' | 'duel' | 'silhouette' | 'training' | 'ppc';
export type ProgramType = 'visual' | 'audio' | 'light' | 'visual-audio' | 'mixed';
export type TimerState = string;
export type Language = 'no' | 'en' | 'sv' | 'da';

export interface ProgramSettings {
  [key: string]: any;
}

export interface TimingStep {
  id: string;
  delay: number; // milliseconds
  state: TimerState;
  command?: string;
  audioEnabled?: boolean;
  countdown?: number; // For visual countdown display (e.g., 10, 9, 8...)
}

export interface UIConfig {
  backgroundColor?: string;
  textColor?: string;
  showTimer?: boolean;
  showCommand?: boolean;
  fullscreen?: boolean;
}

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  language: Language;
}

export interface ProgramConfig {
  id: string;
  name: string;
  category: ProgramCategory;
  type: ProgramType;
  supportedLanguages: Language[];
  defaultSettings: ProgramSettings;
}

export interface ProgramCardProps {
  icon: string;
  title: string;
  description: string;
  category: ProgramCategory;
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  onPress: () => void;
  disabled?: boolean;
}

export interface TimerEvent {
  type: 'state_change' | 'command' | 'complete' | 'pause' | 'resume' | 'reset' | 'countdown';
  state?: TimerState;
  command?: string;
  countdown?: number;
  stepId?: string;
  timestamp: number;
}

export type TimerEventListener = (event: TimerEvent) => void;
