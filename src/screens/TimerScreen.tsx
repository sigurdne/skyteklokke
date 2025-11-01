import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import logger from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Header } from '../components/Header';
import { TimerDisplay } from '../components/TimerDisplay';
import { colors, typography, spacing } from '../theme';
import ProgramManager from '../services/ProgramManager';
import AudioService from '../services/AudioService';
import { TimerEngine } from '../services/TimerEngine';
import { TimerEvent } from '../types';
import * as CustomAudio from '../services/CustomAudioService';

type RootStackParamList = {
  Home: undefined;
  Timer: { programId: string };
};

type TimerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timer'>;
type TimerScreenRouteProp = RouteProp<RootStackParamList, 'Timer'>;

interface TimerScreenProps {
  navigation: TimerScreenNavigationProp;
  route: TimerScreenRouteProp;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const { programId } = route.params;
  
  const [currentState, setCurrentState] = useState<string>('idle');
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [shootingDuration, setShootingDuration] = useState<number>(10);
  const [soundMode, setSoundMode] = useState<boolean>(false);
  // Duel countdown (20,30,60)
  const [duelCountdownDuration, setDuelCountdownDuration] = useState<number>(60);
  const [duelSeries, setDuelSeries] = useState<number>(6);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState<number | null>(null);
  
  // Custom audio recordings state
  const [recordingPhase, setRecordingPhase] = useState<CustomAudio.PhaseKey | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [phaseStatuses, setPhaseStatuses] = useState<Record<CustomAudio.PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }>>({
    shooters_ready: { enabled: false, hasFile: false, offset: 0 },
    ready_command: { enabled: false, hasFile: false, offset: 0 },
    fire_command: { enabled: false, hasFile: false, offset: 0 },
    cease_command: { enabled: false, hasFile: false, offset: 0 },
  });
  
  const timerEngineRef = useRef<TimerEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved shooting duration on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedDuration = await AsyncStorage.getItem('shootingDuration');
        if (savedDuration !== null) {
          setShootingDuration(parseInt(savedDuration, 10));
        }
        const savedSoundMode = await AsyncStorage.getItem('soundMode');
        if (savedSoundMode !== null) {
          setSoundMode(savedSoundMode === 'true');
        } else {
          const legacyTrainingMode = await AsyncStorage.getItem('trainingMode');
          if (legacyTrainingMode !== null) {
            const legacyEnabled = legacyTrainingMode === 'true';
            setSoundMode(legacyEnabled);
            try {
              await AsyncStorage.setItem('soundMode', legacyTrainingMode);
              await AsyncStorage.removeItem('trainingMode');
            } catch (migrateError) {
              logger.warn('Failed to migrate legacy trainingMode key to soundMode:', migrateError);
            }
          }
        }
        const savedDuelCountdown = await AsyncStorage.getItem('duelCountdownDuration');
        if (savedDuelCountdown !== null) {
          setDuelCountdownDuration(parseInt(savedDuelCountdown, 10));
        }
        const savedDuelSeries = await AsyncStorage.getItem('duelSeries');
        if (savedDuelSeries !== null) {
          setDuelSeries(parseInt(savedDuelSeries, 10));
        }
      } catch (error) {
        logger.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const loadPhaseStatuses = async () => {
    try {
      const statuses = await CustomAudio.getPhaseStatuses(programId);
      setPhaseStatuses(statuses);
    } catch (error) {
      logger.error('Failed to load phase statuses:', error);
    }
  };

  // Load phase statuses when settings modal opens
  useEffect(() => {
    const isFieldProgram = programId === 'standard-field';
    if (showSettings && isFieldProgram) {
      loadPhaseStatuses();
    }
  }, [showSettings, programId]);

  // Cleanup: deactivate keep awake when component unmounts
  useEffect(() => {
    return () => {
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        // Ignore errors on unmount
      }
    };
  }, []);

  // Save shooting duration when it changes
  const updateShootingDuration = async (duration: number) => {
    setShootingDuration(duration);
    try {
      await AsyncStorage.setItem('shootingDuration', duration.toString());
    } catch (error) {
      logger.error('Failed to save shooting duration:', error);
    }
  };

  const updateDuelCountdownDuration = async (duration: number) => {
    setDuelCountdownDuration(duration);
    try {
      await AsyncStorage.setItem('duelCountdownDuration', duration.toString());
    } catch (error) {
      logger.error('Failed to save duel countdown duration:', error);
    }
  };

  const updateDuelSeries = async (series: number) => {
    setDuelSeries(series);
    try {
      await AsyncStorage.setItem('duelSeries', series.toString());
    } catch (error) {
      logger.error('Failed to save duel series:', error);
    }
  };

  // Save sound mode when it changes
  const updateSoundMode = async (enabled: boolean) => {
    setSoundMode(enabled);
    try {
      await AsyncStorage.setItem('soundMode', enabled.toString());
      await AsyncStorage.removeItem('trainingMode');
    } catch (error) {
      logger.error('Failed to save sound mode:', error);
    }
  };

  const initializeTimer = async () => {
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      return null;
    }

    // Update program settings with custom shooting duration and sound mode for field program
    if (programId === 'standard-field') {
      program.updateSettings({ 
        shootingDuration,
        soundMode,
        competitionMode: !soundMode  // Competition mode is opposite of sound mode
      });
    }

    // Pass duel-specific countdownDuration to program
    if (programId === 'standard-duel') {
      program.updateSettings({
        countdownDuration: duelCountdownDuration,
        numberOfCycles: duelSeries,
      });
    }

    let sequence = program.getTimingSequence();
    
    // Adjust timing based on custom audio duration and offsets
  if (programId === 'standard-field' && soundMode) {
      // Adjust shooters_ready delay based on custom audio duration
      const shootersReadyStep = sequence.find(s => s.id === 'shooters_ready');
      if (shootersReadyStep) {
        const duration = await CustomAudio.getRecordingDuration(programId, 'shooters_ready');
        const offset = await CustomAudio.getOffset(programId, 'shooters_ready');
        if (duration > 0) {
          // Add 500ms buffer to ensure audio completes, adjusted by offset
          shootersReadyStep.delay = duration + 500 + offset;
          logger.log(`Adjusted shooters_ready delay to ${shootersReadyStep.delay}ms (offset: ${offset}ms)`);
        } else {
          // Use 3 seconds for TTS fallback
          shootersReadyStep.delay = 3000 + offset;
        }
      }

      // Apply offsets by adding pre-play commands earlier in the sequence
      // Negative offset = add command earlier to compensate for audio initialization delay
      
      const readyCommandOffset = await CustomAudio.getOffset(programId, 'ready_command');
      const fireCommandOffset = await CustomAudio.getOffset(programId, 'fire_command');
      const ceaseCommandOffset = await CustomAudio.getOffset(programId, 'cease_command');

      logger.log(`Audio offsets: ready=${readyCommandOffset}ms, fire=${fireCommandOffset}ms, cease=${ceaseCommandOffset}ms`);

      const insertPrePlayStep = (
        commandStepId: string,
        prePlayId: string,
        prePlayState: string,
        offset: number,
      ) => {
        if (offset >= 0) {
          return;
        }

        const commandIndex = sequence.findIndex((s) => s.id === commandStepId);
        if (commandIndex <= 0) {
          logger.log(`No command step ${commandStepId} found for pre-play insertion`);
          return;
        }

        // Sum of delays before the command step determines the maximum lead we can apply
        let maxLead = 0;
        for (let i = 0; i < commandIndex; i++) {
          const delay = typeof sequence[i].delay === 'number' ? sequence[i].delay : 0;
          maxLead += Math.max(0, delay);
        }

        if (maxLead <= 1) {
          logger.log(`Insufficient lead time (${maxLead}ms) before ${commandStepId}; skipping pre-play insertion`);
          return;
        }

        const MIN_STEP_DELAY = 1;
        const desiredLead = Math.min(Math.abs(offset), maxLead - MIN_STEP_DELAY);
        if (desiredLead < 1) {
          logger.log(`Desired lead ${desiredLead}ms too small for ${prePlayId}`);
          return;
        }

        let remaining = desiredLead;
        let insertIndex = commandIndex;
        let removalAmount = 0;
        let lastFullStepIndex = -1;

        for (let i = commandIndex - 1; i >= 0; i--) {
          const step = sequence[i];
          const delay = typeof step.delay === 'number' ? step.delay : 0;
          if (delay <= MIN_STEP_DELAY) {
            continue;
          }

          if (remaining >= delay) {
            remaining -= delay;
            lastFullStepIndex = i;
            continue;
          }

          // We split this step: keep the early part, convert the late part into pre-play delay
          removalAmount = Math.max(MIN_STEP_DELAY, Math.min(delay - MIN_STEP_DELAY, remaining));
          const newDelay = delay - removalAmount;
          step.delay = Math.max(MIN_STEP_DELAY, newDelay);
          insertIndex = i + 1;
          remaining -= removalAmount;
          break;
        }

        if (removalAmount === 0) {
          if (remaining > 0) {
            logger.log(`Unable to locate sufficient lead for ${prePlayId}; remaining=${remaining}ms`);
            return;
          }

          let targetIndex = lastFullStepIndex;
          while (targetIndex >= 0) {
            const step = sequence[targetIndex];
            const delay = typeof step.delay === 'number' ? step.delay : 0;
            if (delay > MIN_STEP_DELAY) {
              removalAmount = Math.min(delay - MIN_STEP_DELAY, Math.max(MIN_STEP_DELAY, 1));
              step.delay = delay - removalAmount;
              insertIndex = targetIndex;
              break;
            }
            targetIndex--;
          }

          if (removalAmount === 0) {
            logger.log(`No adjustable step found for ${prePlayId}; skipping pre-play insertion`);
            return;
          }
        }

        const achievedLead = desiredLead - Math.max(0, remaining);
        if (achievedLead <= 0) {
          logger.log(`Unable to insert pre-play step for ${prePlayId}; achieved lead ${achievedLead}ms`);
          return;
        }

        const prePlayDelay = Math.max(MIN_STEP_DELAY, removalAmount || achievedLead);
        const prePlayStep = {
          id: prePlayId,
          state: prePlayState,
          countdown: undefined,
          command: prePlayId,
          audioEnabled: true,
          delay: prePlayDelay,
        };

        sequence.splice(insertIndex, 0, prePlayStep as any);
        logger.log(
          `Inserted ${prePlayId} (${prePlayDelay}ms) achieving ${achievedLead}ms lead before ${commandStepId}`,
        );
      };

      insertPrePlayStep(
        'prepare_warning_5',
        'preplay_ready_command',
        'prepare',
        readyCommandOffset,
      );

      insertPrePlayStep(
        'fire_start',
        'preplay_fire_command',
        'prepare_warning',
        fireCommandOffset,
      );

      insertPrePlayStep(
        'fire_warning_2',
        'preplay_cease_command',
        'fire',
        ceaseCommandOffset,
      );
    }
    
    return new TimerEngine(sequence);
  };

  useEffect(() => {
    // Initialize program
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      navigation.goBack();
      return;
    }

    ProgramManager.setActiveProgram(programId);

    // Setup audio service
    AudioService.setLanguage(i18n.language as any);

    // Cleanup
    return () => {
      if (timerEngineRef.current) {
        try {
          timerEngineRef.current.removeEventListener(handleTimerEvent);
        } catch (e) {
          // ignore
        }
        timerEngineRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      AudioService.stop();
      ProgramManager.clearActiveProgram();
    };
  }, [programId, navigation, i18n.language]);

  // Event handler for timer events
  const handleTimerEvent = async (event: TimerEvent) => {
    try {
    // main handler
    
    // If event includes stepId and we're in duel, parse series
    if (event.stepId && programId === 'standard-duel') {
      // stepId format: series_{seriesIndex}_rest... or finished
      const m = event.stepId.match(/^series_(\d+)_/);
      if (m) {
        const seriesNum = parseInt(m[1], 10);
        setCurrentSeriesIndex(seriesNum);
      } else {
        setCurrentSeriesIndex(null);
      }
    }
    if (event.type === 'state_change') {
      setCurrentState(event.state || 'idle');
      // Handle command display text from state_change event
      // Skip system commands like 'beep' and 'continuous_beep'
      // Skip pre-play commands (they're internal timing adjustments, not user-visible commands)
      const isPrePlayCommand = event.command?.startsWith('preplay_');
      if (event.command && event.command !== 'beep' && event.command !== 'continuous_beep' && !isPrePlayCommand) {
        let translatedCommand = '';
        try {
          translatedCommand = t(`commands.${event.command}`);
        } catch (e) {
          translatedCommand = String(event.command);
        }
        setCurrentCommand(translatedCommand);
      } else if (!event.command || event.command === 'beep' || event.command === 'continuous_beep' || isPrePlayCommand) {
        // Clear command text if no command or beep command or pre-play command
        setCurrentCommand('');
      }
    }

    if (event.type === 'countdown') {
      const newCountdown = event.countdown || null;
      setCountdown(newCountdown);
      
      // Derive display text based on state and countdown for field shooting
      if (programId === 'standard-field' && newCountdown !== null) {
        const state = event.state || currentState;
        
        // PREPARE phase (white, 10-6): no text for first 5 seconds (countdown 10-6)
        if (state === 'prepare' && newCountdown > 5) {
          setCurrentCommand('');
        }
        // PREPARE_WARNING phase (yellow, 5): show "KLAR!"
        else if (state === 'prepare_warning' && newCountdown === 5) {
          setCurrentCommand(t('commands.ready_command'));
        }
        // PREPARE_WARNING phase (yellow, 4-1): no text
        else if (state === 'prepare_warning' && newCountdown < 5 && newCountdown >= 1) {
          setCurrentCommand('');
        }
        // FIRE phase start (green, at shootingDuration): show "ILD!"
        else if (state === 'fire' && newCountdown === shootingDuration) {
          setCurrentCommand(t('commands.fire_command'));
        }
        // FIRE phase (green, countdown < shootingDuration): no text
        else if (state === 'fire' && newCountdown < shootingDuration && newCountdown > 2) {
          setCurrentCommand('');
        }
        // FIRE_WARNING phase (yellow): show "STAANS"
        else if (state === 'fire_warning') {
          setCurrentCommand(t('commands.cease_command'));
        }
        // FINISHED phase (red, 0): no text
        else if (state === 'finished' && newCountdown === 0) {
          setCurrentCommand('');
        }
      }
    }
    
    if (event.type === 'command' && event.command) {
      // Handle pre-play commands (start audio early for negative offsets)
      if (event.command === 'preplay_ready_command') {
        logger.log(`🎵 PRE-PLAY ready_command - starting audio early`);
        await CustomAudio.playIfEnabled(programId, 'ready_command');
        // Don't show any visual feedback for pre-play
      } else if (event.command === 'preplay_fire_command') {
        logger.log(`🎵 PRE-PLAY fire_command - starting audio early`);
        await CustomAudio.playIfEnabled(programId, 'fire_command');
      } else if (event.command === 'preplay_cease_command') {
        logger.log(`🎵 PRE-PLAY cease_command - starting audio early`);
        await CustomAudio.playIfEnabled(programId, 'cease_command');
      }
      // Handle system beeps for training mode
      else if (event.command === 'beep') {
        // Use stepId to determine phase since countdown isn't available in command events
        // stepId formats: prepare_10, prepare_warning_5, fire_start (shootingDuration)
        const eventState = event.state || currentState;
        const stepId = event.stepId || '';
        
        logger.log(`🎵 BEEP event - state: ${eventState}, stepId: ${stepId}, shootingDuration: ${shootingDuration}`);
        
        let customDuration = 0;
        
        // KLAR! - at prepare_warning phase start (stepId = prepare_warning_5)
        // Audio might already be playing if we used pre-play
        if (eventState === 'prepare_warning' && stepId === 'prepare_warning_5') {
          // Check if we already started audio via pre-play
          const readyCommandOffset = await CustomAudio.getOffset(programId, 'ready_command');
          if (readyCommandOffset >= 0) {
            // Positive or zero offset - play now (no pre-play was inserted)
            customDuration = await CustomAudio.playIfEnabled(programId, 'ready_command');
            logger.log(`✅ Custom audio for ready_command: duration=${customDuration}ms`);
          } else {
            // Negative offset - audio was already started by pre-play command
            logger.log(`✅ Audio for ready_command already playing (started ${-readyCommandOffset}ms ago)`);
            customDuration = 1; // Indicate custom audio is active
          }
        } 
        // ILD! - at fire phase start (stepId = fire_start, countdown = shootingDuration)
        else if (eventState === 'fire' && stepId === 'fire_start') {
          const fireCommandOffset = await CustomAudio.getOffset(programId, 'fire_command');
          if (fireCommandOffset >= 0) {
            customDuration = await CustomAudio.playIfEnabled(programId, 'fire_command');
            logger.log(`✅ Custom audio for fire_command: duration=${customDuration}ms`);
          } else {
            logger.log(`✅ Audio for fire_command already playing (started ${-fireCommandOffset}ms ago)`);
            customDuration = 1;
          }
        } else {
          logger.log(`❌ No custom audio condition matched`);
        }
        
        // Fall back to beep if no custom audio
        if (customDuration === 0) {
          AudioService.playBeep(false);
        }
        // Don't clear command - keep showing the current display text
      } else if (event.command === 'continuous_beep') {
        // STAANS! - at fire_warning phase (continuous beep)
        const ceaseCommandOffset = await CustomAudio.getOffset(programId, 'cease_command');
        
        let customDuration = 0;
        if (ceaseCommandOffset >= 0) {
          customDuration = await CustomAudio.playIfEnabled(programId, 'cease_command');
          logger.log(`Custom audio for cease_command: duration=${customDuration}ms`);
        } else {
          logger.log(`✅ Audio for cease_command already playing (started ${-ceaseCommandOffset}ms ago)`);
          customDuration = 1;
        }
        
        if (customDuration === 0) {
          AudioService.playBeep(true);
        }
        // Don't clear command - keep showing the current display text
      } else if (event.command === 'shooters_ready') {
        // "Er skytterne klare" - initial announcement in training mode
        // Delay is now handled in the timing sequence, so we just play the audio
        const duration = await CustomAudio.playIfEnabled(programId, 'shooters_ready');
        logger.log(`Custom audio playing for shooters_ready: duration=${duration}ms`);
        
        if (duration === 0) {
          // Fall back to TTS if no custom recording
          const translatedCommand = t(`commands.${event.command}`);
          try { 
            AudioService.speak(translatedCommand);
          } catch (e) { 
            logger.error('AudioService.speak failed', e); 
          }
        }
        // Don't set currentCommand - keep screen blank during initial announcement
      } else {
        // Handle voice commands (like "go")
        let translatedCommand = '';
        try {
          translatedCommand = t(`commands.${event.command}`);
        } catch (e) {
          translatedCommand = String(event.command);
        }
        setCurrentCommand(translatedCommand);
        // Don't clear countdown - we want to keep showing it during shooting phase
        // Only speak in non-competition mode
        const program = ProgramManager.getProgram(programId);
        const settings = program?.getSettings();
  const isSoundMode = settings?.soundMode || false;
  if (isSoundMode) {
          try { AudioService.speak(translatedCommand); } catch (e) { logger.error('AudioService.speak failed', e); }
        }
      }
    }
    } catch (err) {
      // Log and persist diagnostics but don't crash
      logger.error('TimerScreen.handleTimerEvent error:', err, 'event=', event);
      try {
        (timerEngineRef.current as any)?.pushDiagnostic?.({ timestamp: Date.now(), note: 'handle_event_error', event });
      } catch (e) {
        // ignore
      }
    }
    
    if (event.type === 'complete') {
      // Don't stop - keep showing the final state (red screen with 0)
      // User can tap screen to return
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Deactivate keep awake when timer completes
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        logger.log('Failed to deactivate keep awake on complete:', e);
      }
    }

    if (event.type === 'pause') {
      setIsPaused(true);
    }

    if (event.type === 'resume') {
      setIsPaused(false);
    }

    if (event.type === 'reset') {
      setCurrentState('idle');
      setCurrentCommand('');
      setElapsedTime(0);
      setIsRunning(false);
      setIsPaused(false);
      setCountdown(null);
    }
  };

  // Update elapsed time display
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (timerEngineRef.current) {
          setElapsedTime(timerEngineRef.current.getElapsedTime());
        }
      }, 50); // Update every 50ms for smooth display

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, isPaused]);

  const handleStart = async () => {
    if (!isRunning) {
      // Initialize timer engine with current settings
      const engine = await initializeTimer();
      if (engine) {
        timerEngineRef.current = engine;
        // ensure we don't double-register
        timerEngineRef.current.removeEventListener(handleTimerEvent);
        timerEngineRef.current.addEventListener(handleTimerEvent);
        timerEngineRef.current.start();
        setIsRunning(true);
        // Keep screen awake while timer is running
        try {
          await activateKeepAwakeAsync('timer-active');
        } catch (e) {
          logger.log('Failed to activate keep awake:', e);
        }
      }
    }
  };

  const handlePause = () => {
    if (timerEngineRef.current && isRunning && !isPaused) {
      timerEngineRef.current.pause();
    }
  };

  const handleResume = () => {
    if (timerEngineRef.current && isRunning && isPaused) {
      timerEngineRef.current.resume();
    }
  };

  const handleReset = () => {
    if (timerEngineRef.current) {
      try {
        timerEngineRef.current.removeEventListener(handleTimerEvent);
      } catch (e) {
        // ignore
      }
      timerEngineRef.current.reset();
      setElapsedTime(0);
    }
  };

  const handleStop = () => {
    if (timerEngineRef.current) {
      try {
        timerEngineRef.current.removeEventListener(handleTimerEvent);
      } catch (e) {
        // ignore
      }
      timerEngineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      setCountdown(null);
      setCurrentState('idle');
      // Allow screen to sleep again
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        logger.log('Failed to deactivate keep awake:', e);
      }
      setCurrentCommand('');
      setElapsedTime(0);
    }
  };

  const handleBack = () => {
    if (isRunning) {
      handleReset();
    }
    navigation.goBack();
  };

  const program = ProgramManager.getProgram(programId);
  const uiConfig = program?.getUIConfig();
  const backgroundColor = uiConfig?.backgroundColor || colors.background;
  const textColor = uiConfig?.textColor || colors.text;

  // For field and duel programs, show fullscreen display
  const isFieldProgram = programId === 'standard-field';
  const isDuelProgram = programId === 'standard-duel';
  const showFullscreenDisplay = (isFieldProgram || isDuelProgram) && isRunning;

  const getDisplayColor = (): string => {
    // Field shooting colors based on state
    if (isFieldProgram) {
      if (currentState === 'prepare') return '#FFFFFF'; // White
      if (currentState === 'prepare_warning') return '#FFC107'; // Yellow
      if (currentState === 'fire') return '#4CAF50'; // Green
      if (currentState === 'fire_warning') return '#FFC107'; // Yellow
      if (currentState === 'finished') return '#F44336'; // Red
    }
    
    // Duel shooting colors
    if (isDuelProgram) {
      if (currentState === 'countdown') return '#000000'; // Black background during countdown
      if (currentState === 'red_light') return colors.redLight; // Red light
      if (currentState === 'green_light') return colors.greenLight; // Green light
      if (currentState === 'finished') return colors.redLight; // Permanent red at finish
    }
    
    return backgroundColor;
  };

  const getTimerFontSize = (): number => {
    // Adjust font size based on number of digits in countdown
    const displayValue = countdown !== null ? countdown : 0;
    const numDigits = displayValue.toString().length;
    
    // For 3 digits (100+), use smaller font
    if (numDigits >= 3) {
      return 180;
    }
    // For 2 digits (10-99), use medium font
    if (numDigits >= 2) {
      return 240;
    }
    // For 1 digit (0-9), use large font
    return 240;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primary }]}>
      <View style={styles.container}>
        {!showFullscreenDisplay && (
          <Header
            title={program?.name || 'Timer'}
            onBackPress={handleBack}
          />
        )}
        
        {showFullscreenDisplay ? (
          <TouchableOpacity 
            style={[styles.fullscreenDisplay, { backgroundColor: getDisplayColor() }]}
            onPress={handleStop}
            activeOpacity={0.9}
          >
            {isDuelProgram && currentSeriesIndex !== null && (
              <Text style={[styles.fullscreenCommand, { color: '#FFFFFF', fontSize: 28 }]}> 
                {`Serie ${currentSeriesIndex}/${duelSeries}`}
              </Text>
            )}
            {currentCommand && (
              <Text style={[styles.fullscreenCommand, { 
                color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF' 
              }]}>
                {currentCommand}
              </Text>
            )}
            <Text style={[styles.fullscreenTimer, { 
              color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF',
              fontSize: getTimerFontSize()
            }]}>
              {countdown !== null ? countdown : 0}
            </Text>
          </TouchableOpacity>
        ) : (
          // Show a large, uppercase idle label across 90% width on the main screen
          (currentState === 'idle') ? (
            <View style={styles.idleContainer}>
              <Text
                accessible
                accessibilityRole="text"
                style={{
                  ...typography.h2,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  color: textColor,
                }}
              >
                {t('states.idle')}
              </Text>
            </View>
          ) : (
            <TimerDisplay
              time={elapsedTime}
              state={currentState ? t(`states.${currentState}`) : t('states.idle')}
              command={currentCommand}
              countdown={countdown}
              backgroundColor={backgroundColor}
              textColor={textColor}
            />
          )
        )}

        <View style={[styles.controls, styles.controlsBottom]}>
          {!isRunning && (isFieldProgram || isDuelProgram) && (
            <TouchableOpacity 
              style={[styles.button, styles.settingsButton]} 
              onPress={async () => {
                setShowSettings(true);
                // Load phase statuses when opening settings
                if (soundMode) {
                  await loadPhaseStatuses();
                }
              }}
            >
              <Text style={styles.buttonText}>{isFieldProgram ? `⚙️ ${shootingDuration}s` : '⚙️ Innstillinger'}</Text>
            </TouchableOpacity>
          )}
          {!isRunning && (
            <TouchableOpacity style={styles.button} onPress={handleStart}>
              <Text style={styles.buttonText}>{t('controls.start')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Modal for Field Shooting */}
        <Modal
          visible={showSettings}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Innstillinger</Text>
              
              {isFieldProgram && (
                <>
                  {/* Sound Mode Toggle */}
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>lydmodus</Text>
                    <TouchableOpacity
                      style={[styles.toggle, soundMode && styles.toggleActive]}
                      onPress={() => updateSoundMode(!soundMode)}
                    >
                      <View style={[styles.toggleThumb, soundMode && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.settingDescription}>
                    {soundMode 
                      ? 'innspilte kommandoer' 
                      : 'ingen lyd, kun visuelle signaler'}
                  </Text>

                  {/* Duration Picker */}
                  <Text style={styles.modalSubtitle}>
                    Skytetid
                  </Text>
                  
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={shootingDuration}
                      onValueChange={(value) => updateShootingDuration(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 11 }, (_, i) => 4 + i * 2).map((duration) => (
                        <Picker.Item 
                          key={duration} 
                          label={`${duration} sekunder`} 
                          value={duration} 
                        />
                      ))}
                      <Picker.Item 
                        key={150} 
                        label="150 sekunder" 
                        value={150} 
                      />
                    </Picker>
                  </View>

                  {/* Custom Audio Recordings - Only in sound mode */}
                  {soundMode && (
                    <>
                      <Text style={[styles.modalSubtitle, { marginTop: spacing.lg }]}>
                        Egendefinerte opptak
                      </Text>
                      <Text style={[styles.settingDescription, { marginBottom: spacing.md }]}>
                        Ta opp dine egne kommandoer for hver fase
                      </Text>

                      <ScrollView style={{ maxHeight: 300 }}>
                        {CustomAudio.getAllPhases().map((phase) => {
                          const status = phaseStatuses[phase];
                          const isRecordingThis = isRecording && recordingPhase === phase;
                          
                          return (
                            <View key={phase} style={styles.phaseCard}>
                              <View style={styles.phaseHeader}>
                                <Text style={styles.phaseLabel}>
                                  {CustomAudio.getPhaseLabel(phase)}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.smallToggle, status.enabled && styles.toggleActive]}
                                  onPress={async () => {
                                    const newEnabled = !status.enabled;
                                    await CustomAudio.setEnabled(programId, phase, newEnabled);
                                    await loadPhaseStatuses();
                                  }}
                                  disabled={!status.hasFile}
                                >
                                  <View style={[styles.smallToggleThumb, status.enabled && styles.toggleThumbActive]} />
                                </TouchableOpacity>
                              </View>

                              <View style={styles.phaseButtons}>
                                {!isRecordingThis ? (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.phaseButton, styles.recordButton]}
                                      onPress={async () => {
                                        try {
                                          await CustomAudio.startRecording(programId, phase);
                                          setIsRecording(true);
                                          setRecordingPhase(phase);
                                        } catch (error) {
                                          logger.error('Start recording error:', error);
                                          Alert.alert('Feil', 'Kunne ikke starte opptak. Sjekk mikrofontillatelser.');
                                        }
                                      }}
                                    >
                                      <Text style={styles.phaseButtonText}>🎙️ Ta opp</Text>
                                    </TouchableOpacity>

                                    {status.hasFile && (
                                      <>
                                        <TouchableOpacity
                                          style={[styles.phaseButton, styles.playButton]}
                                          onPress={async () => {
                                            try {
                                              await CustomAudio.playIfEnabled(programId, phase);
                                            } catch (error) {
                                              logger.error('Play error:', error);
                                            }
                                          }}
                                        >
                                          <Text style={styles.phaseButtonText}>▶️ Test</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={[styles.phaseButton, styles.deleteButton]}
                                          onPress={() => {
                                            Alert.alert(
                                              'Slett opptak',
                                              `Vil du slette opptaket for ${CustomAudio.getPhaseLabel(phase)}?`,
                                              [
                                                { text: 'Avbryt', style: 'cancel' },
                                                {
                                                  text: 'Slett',
                                                  style: 'destructive',
                                                  onPress: async () => {
                                                    await CustomAudio.deleteRecording(programId, phase);
                                                    await loadPhaseStatuses();
                                                  },
                                                },
                                              ]
                                            );
                                          }}
                                        >
                                          <Text style={styles.phaseButtonText}>🗑️</Text>
                                        </TouchableOpacity>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.phaseButton, styles.stopButton]}
                                      onPress={async () => {
                                        try {
                                          await CustomAudio.stopRecording(programId, phase);
                                          setIsRecording(false);
                                          setRecordingPhase(null);
                                          await loadPhaseStatuses();
                                          // Auto-enable after recording
                                          await CustomAudio.setEnabled(programId, phase, true);
                                          await loadPhaseStatuses();
                                        } catch (error) {
                                          logger.error('Stop recording error:', error);
                                          Alert.alert('Feil', 'Kunne ikke lagre opptak');
                                        }
                                      }}
                                    >
                                      <Text style={styles.phaseButtonText}>⏹️ Stopp og lagre</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={[styles.phaseButton, styles.cancelButton]}
                                      onPress={async () => {
                                        await CustomAudio.cancelRecording();
                                        setIsRecording(false);
                                        setRecordingPhase(null);
                                      }}
                                    >
                                      <Text style={styles.phaseButtonText}>❌ Avbryt</Text>
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>

                              {!status.hasFile && !isRecordingThis && (
                                <Text style={styles.phaseHint}>Ingen opptak ennå</Text>
                              )}
                              {isRecordingThis && (
                                <Text style={[styles.phaseHint, { color: colors.danger }]}>● Tar opp...</Text>
                              )}

                              {/* Timing offset adjustment */}
                              {status.hasFile && !isRecordingThis && (
                                <View style={styles.offsetContainer}>
                                  <Text style={styles.offsetLabel}>
                                    Tidsforskyvning: {status.offset}ms
                                  </Text>
                                  <View style={styles.offsetButtons}>
                                    <TouchableOpacity
                                      style={styles.offsetButton}
                                      onPress={async () => {
                                        const newOffset = status.offset - 100;
                                        await CustomAudio.setOffset(programId, phase, newOffset);
                                        await loadPhaseStatuses();
                                      }}
                                    >
                                      <Text style={styles.offsetButtonText}>-100ms</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.offsetButton}
                                      onPress={async () => {
                                        const newOffset = status.offset - 50;
                                        await CustomAudio.setOffset(programId, phase, newOffset);
                                        await loadPhaseStatuses();
                                      }}
                                    >
                                      <Text style={styles.offsetButtonText}>-50ms</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.offsetButton}
                                      onPress={async () => {
                                        await CustomAudio.setOffset(programId, phase, 0);
                                        await loadPhaseStatuses();
                                      }}
                                    >
                                      <Text style={styles.offsetButtonText}>0</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.offsetButton}
                                      onPress={async () => {
                                        const newOffset = status.offset + 50;
                                        await CustomAudio.setOffset(programId, phase, newOffset);
                                        await loadPhaseStatuses();
                                      }}
                                    >
                                      <Text style={styles.offsetButtonText}>+50ms</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.offsetButton}
                                      onPress={async () => {
                                        const newOffset = status.offset + 100;
                                        await CustomAudio.setOffset(programId, phase, newOffset);
                                        await loadPhaseStatuses();
                                      }}
                                    >
                                      <Text style={styles.offsetButtonText}>+100ms</Text>
                                    </TouchableOpacity>
                                  </View>
                                  <Text style={styles.offsetHint}>
                                    {status.offset < 0 ? 'Spiller tidligere' : status.offset > 0 ? 'Spiller senere' : 'Perfekt timing'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </>
                  )}
                </>
              )}

              {isDuelProgram && (
                <>
                  <Text style={styles.modalSubtitle}>Antall serier (duell)</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={duelSeries}
                      onValueChange={(value) => updateDuelSeries(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {[1, 6, 12].map((s) => (
                        <Picker.Item key={s} label={`${s}`} value={s} />
                      ))}
                    </Picker>
                  </View>

                  <Text style={styles.modalSubtitle}>Nedtelling mellom serier (sek)</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={duelCountdownDuration}
                      onValueChange={(value) => updateDuelCountdownDuration(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {[20, 30, 60].map((v) => (
                        <Picker.Item key={v} label={`${v} sek`} value={v} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.modalButton]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  controlsBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '33%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '33%', // keep text above the controls
  },
  button: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    minWidth: 120,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  resumeButton: {
    backgroundColor: colors.success,
  },
  resetButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    ...typography.button,
    color: colors.background,
    textAlign: 'center',
  },
  lightDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightTimer: {
    fontSize: 96,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  lightState: {
    fontSize: 32,
    fontWeight: '600',
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
  fullscreenDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenTimer: {
    fontSize: 240,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  fullscreenCommand: {
    fontSize: 56,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  settingLabel: {
    ...typography.h3,
    color: colors.text,
  },
  settingDescription: {
    ...typography.body,
    color: colors.secondary,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  toggle: {
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.secondary,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  modalSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.secondary,
    marginBottom: spacing.lg,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 8,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  pickerItem: {
    fontSize: 20,
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    minWidth: 150,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  // Custom Audio Recording Styles
  phaseCard: {
    backgroundColor: colors.surface || '#1a1a1a',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  phaseLabel: {
    ...typography.h3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  smallToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    padding: 2,
    justifyContent: 'center',
  },
  smallToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
  },
  phaseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  phaseButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  phaseButtonText: {
    ...typography.button,
    fontSize: 14,
    color: colors.background,
  },
  recordButton: {
    backgroundColor: colors.danger,
  },
  playButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.secondary,
  },
  stopButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  phaseHint: {
    ...typography.body,
    fontSize: 12,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  offsetContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.secondary + '40',
  },
  offsetLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  offsetButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  offsetButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.primary + '30',
    minWidth: 60,
    alignItems: 'center',
  },
  offsetButtonText: {
    ...typography.button,
    fontSize: 11,
    color: colors.primary,
  },
  offsetHint: {
    ...typography.body,
    fontSize: 11,
    color: colors.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
