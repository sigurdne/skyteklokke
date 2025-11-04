import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/Header';
import { TimerDisplay } from '../../components/TimerDisplay';
import ProgramManager from '../../services/ProgramManager';
import AudioService from '../../services/AudioService';
import logger from '../../utils/logger';
import { TimerEngine } from '../../services/TimerEngine';
import { TimerEvent, TimingStep } from '../../types';
import { colors, typography } from '../../theme';
import { timerStyles } from './timerStyles';

export type RootStackParamList = {
  Home: undefined;
  Timer: { programId: string };
};

export type TimerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timer'>;
export type TimerScreenRouteProp = RouteProp<RootStackParamList, 'Timer'>;

export interface TimerScreenProps {
  navigation: TimerScreenNavigationProp;
  route: TimerScreenRouteProp;
}

export interface TimerDisplayContext {
  currentState: string;
  countdown: number | null;
  isRunning: boolean;
  isPaused: boolean;
  backgroundColor: string;
  textColor: string;
}

export interface TimerSequenceContext {
  programId: string;
}

export interface TimerEventHelpers {
  programId: string;
  setCurrentCommand: (value: string) => void;
  clearCurrentCommand: () => void;
  setCountdown: (value: number | null) => void;
  getCountdown: () => number | null;
  setCurrentState: (value: string) => void;
  getCurrentState: () => string;
  setIsPaused: (value: boolean) => void;
  setIsRunning: (value: boolean) => void;
  timerEngineRef: React.MutableRefObject<TimerEngine | null>;
}

export interface TimerProgramSettingsBindings {
  showButton: boolean;
  buttonLabel?: string;
  open: () => Promise<void> | void;
  close: () => void;
  isVisible: boolean;
  renderContent?: () => React.ReactNode;
}

export interface TimerProgramBindings {
  settings?: TimerProgramSettingsBindings;
  beforeTimerStart?: (program: any) => Promise<void> | void;
  adjustSequence?: (sequence: TimingStep[], context: TimerSequenceContext) => Promise<TimingStep[] | void> | TimingStep[] | void;
  handleTimerEvent?: (event: TimerEvent, helpers: TimerEventHelpers) => Promise<boolean | void> | boolean | void;
  showFullscreenDisplay?: (context: TimerDisplayContext) => boolean;
  getDisplayColor?: (context: TimerDisplayContext) => string;
  getTimerFontSize?: (context: TimerDisplayContext) => number;
  renderFullscreenOverlay?: (context: TimerDisplayContext) => React.ReactNode;
  cleanup?: () => void;
  renderStartControls?: (context: TimerStartControlContext) => React.ReactNode;
  showDefaultStartButton?: boolean;
}

export interface TimerStartControlContext {
  startTimer: () => Promise<void>;
  isRunning: boolean;
  isPaused: boolean;
  currentState: string;
  currentCommand: string;
  countdown: number | null;
}

export interface TimerProgramAdapterContext {
  programId: string;
  t: ReturnType<typeof useTranslation>['t'];
  i18n: ReturnType<typeof useTranslation>['i18n'];
}

export interface TimerProgramAdapter {
  id: string;
  useBindings: (context: TimerProgramAdapterContext) => TimerProgramBindings;
}

interface BaseTimerScreenProps extends TimerScreenProps {
  adapter: TimerProgramAdapter;
}

export const BaseTimerScreen: React.FC<BaseTimerScreenProps> = ({ navigation, route, adapter }) => {
  const { t, i18n } = useTranslation();
  const { programId } = route.params;

  const [currentState, setCurrentState] = useState<string>('idle');
  const [currentCommand, setCurrentCommandState] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [countdown, setCountdownState] = useState<number | null>(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState<boolean>(false);

  const timerEngineRef = useRef<TimerEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>();
  const currentStateRef = useRef<string>('idle');
  const currentCommandRef = useRef<string>('');
  const countdownRef = useRef<number | null>(null);

  const updateCurrentState = useCallback((value: string) => {
    setCurrentState(value);
    currentStateRef.current = value;
  }, []);

  const updateCurrentCommand = useCallback((value: string) => {
    setCurrentCommandState(value);
    currentCommandRef.current = value;
  }, []);

  const clearCurrentCommand = useCallback(() => {
    updateCurrentCommand('');
  }, [updateCurrentCommand]);

  const updateCountdown = useCallback((value: number | null) => {
    setCountdownState(value);
    countdownRef.current = value;
  }, []);

  const adapterBindings = adapter.useBindings({ programId, t, i18n });
  cleanupRef.current = adapterBindings.cleanup;

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Load sound mode migration once at start (shared fallback for legacy key)
  useEffect(() => {
    const migrateLegacySoundMode = async () => {
      try {
        const legacyTrainingMode = await AsyncStorage.getItem('trainingMode');
        if (legacyTrainingMode !== null) {
          await AsyncStorage.setItem('soundMode', legacyTrainingMode);
          await AsyncStorage.removeItem('trainingMode');
        }
      } catch (error) {
        logger.warn('Failed to migrate legacy trainingMode key to soundMode:', error);
      }
    };
    migrateLegacySoundMode();
  }, []);

  useEffect(() => {
    return () => {
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        // Ignore errors on unmount
      }
    };
  }, []);

  useEffect(() => {
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      navigation.goBack();
      return;
    }

    ProgramManager.setActiveProgram(programId);
    AudioService.setLanguage(i18n.language as any);

    // Intercept hardware back button and gestures
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Block navigation if timer is running
      if (isRunning && currentState !== 'finished') {
        e.preventDefault();
        return;
      }

      // For PPC programs, navigate to PPC screen with selected discipline
      if (programId === 'ppc-standard') {
        const settings = (program as any).getSettings?.();
        const discipline = settings?.discipline;
        if (discipline) {
          // Prevent default back behavior
          e.preventDefault();
          // Navigate to PPC with discipline parameter
          navigation.navigate('PPC' as any, { selectedDiscipline: discipline });
          return;
        }
      }
      
      // For non-PPC or if discipline not found, allow default back navigation
    });

    return () => {
      unsubscribe();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, navigation, i18n.language]);

  const eventHelpers: TimerEventHelpers = useMemo(() => ({
    programId,
    setCurrentCommand: updateCurrentCommand,
    clearCurrentCommand,
    setCountdown: updateCountdown,
    getCountdown: () => countdownRef.current,
    setCurrentState: updateCurrentState,
    getCurrentState: () => currentStateRef.current,
    setIsPaused,
    setIsRunning,
    timerEngineRef,
  }), [clearCurrentCommand, programId, updateCountdown, updateCurrentCommand, updateCurrentState]);

  const initializeTimer = useCallback(async () => {
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      return null;
    }

    if (adapterBindings.beforeTimerStart) {
      await adapterBindings.beforeTimerStart(program);
    }

    let sequence = program.getTimingSequence();

    if (adapterBindings.adjustSequence) {
      const adjusted = await adapterBindings.adjustSequence(sequence, { programId });
      if (Array.isArray(adjusted)) {
        sequence = adjusted;
      }
    }

    return new TimerEngine(sequence);
  }, [adapterBindings, programId]);

  const handleTimerEvent = useCallback(async (event: TimerEvent) => {
    try {
      if (event.type === 'state_change') {
        const nextState = event.state || 'idle';
        updateCurrentState(nextState);
      }

      if (event.type === 'countdown') {
        const newCountdown = event.countdown ?? null;
        updateCountdown(newCountdown);
      }

      let handledByAdapter = false;
      if (adapterBindings.handleTimerEvent) {
        const result = await adapterBindings.handleTimerEvent(event, eventHelpers);
        handledByAdapter = Boolean(result);
      }

      if (event.type === 'state_change' && !handledByAdapter) {
        const isPrePlayCommand = event.command?.startsWith('preplay_');
        if (event.command && event.command !== 'beep' && event.command !== 'continuous_beep' && !isPrePlayCommand) {
          let translatedCommand = '';
          try {
            translatedCommand = t(`commands.${event.command}`);
          } catch (e) {
            translatedCommand = String(event.command);
          }
          updateCurrentCommand(translatedCommand);
        } else if (!event.command || event.command === 'beep' || event.command === 'continuous_beep' || isPrePlayCommand) {
          clearCurrentCommand();
        }
      }

      if (event.type === 'command' && event.command && !handledByAdapter) {
        if (event.command === 'beep') {
          AudioService.playBeep(false);
        } else if (event.command === 'continuous_beep') {
          AudioService.playBeep(true);
        } else {
          let translatedCommand = '';
          try {
            translatedCommand = t(`commands.${event.command}`);
          } catch (e) {
            translatedCommand = String(event.command);
          }
          updateCurrentCommand(translatedCommand);

          const program = ProgramManager.getProgram(programId);
          const settings = program?.getSettings();
          const isSoundMode = settings?.soundMode || false;
          if (isSoundMode) {
            try {
              AudioService.speak(translatedCommand);
            } catch (speakError) {
              logger.error('AudioService.speak failed', speakError);
            }
          }
        }
      }

      if (event.type === 'complete') {
        setIsPaused(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
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
        updateCurrentState('idle');
        clearCurrentCommand();
        setElapsedTime(0);
        setIsRunning(false);
        setIsPaused(false);
        updateCountdown(null);
      }
    } catch (err) {
      logger.error('TimerScreen.handleTimerEvent error:', err, 'event=', event);
      try {
        (timerEngineRef.current as any)?.pushDiagnostic?.({ timestamp: Date.now(), note: 'handle_event_error', event });
      } catch (diagnosticError) {
        // ignore diagnostic push failures
      }
    }
  }, [adapterBindings, clearCurrentCommand, eventHelpers, programId, t, updateCurrentCommand, updateCurrentState, updateCountdown]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (timerEngineRef.current) {
          setElapsedTime(timerEngineRef.current.getElapsedTime());
        }
      }, 50);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, isPaused]);

  const handleStart = useCallback(async () => {
    if (!isRunning) {
      const engine = await initializeTimer();
      if (engine) {
        timerEngineRef.current = engine;
        timerEngineRef.current.removeEventListener(handleTimerEvent);
        timerEngineRef.current.addEventListener(handleTimerEvent);
        timerEngineRef.current.start();
        setIsRunning(true);
        try {
          await activateKeepAwakeAsync('timer-active');
        } catch (e) {
          logger.log('Failed to activate keep awake:', e);
        }
      }
    }
  }, [handleTimerEvent, initializeTimer, isRunning]);

  const handlePause = useCallback(() => {
    if (timerEngineRef.current && isRunning && !isPaused) {
      timerEngineRef.current.pause();
    }
  }, [isPaused, isRunning]);

  const handleResume = useCallback(() => {
    if (timerEngineRef.current && isRunning && isPaused) {
      timerEngineRef.current.resume();
    }
  }, [isPaused, isRunning]);

  const handleReset = useCallback(() => {
    if (timerEngineRef.current) {
      try {
        timerEngineRef.current.removeEventListener(handleTimerEvent);
      } catch (e) {
        // ignore
      }
      timerEngineRef.current.reset();
      setElapsedTime(0);
    }
  }, [handleTimerEvent]);

  const handleAbort = useCallback(() => {
    setShowAbortConfirm(false);
    
    // Stop the timer
    if (timerEngineRef.current) {
      try {
        timerEngineRef.current.removeEventListener(handleTimerEvent);
      } catch (e) {
        // ignore
      }
      timerEngineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      updateCountdown(null);
      updateCurrentState('idle');
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        logger.log('Failed to deactivate keep awake:', e);
      }
      clearCurrentCommand();
      setElapsedTime(0);
    }

    // Reset the stage - this returns to the command screen
    handleReset();
  }, [handleTimerEvent, handleReset, updateCountdown, updateCurrentState, clearCurrentCommand]);

  const handleStop = useCallback(() => {
    if (timerEngineRef.current) {
      try {
        timerEngineRef.current.removeEventListener(handleTimerEvent);
      } catch (e) {
        // ignore
      }
      timerEngineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      updateCountdown(null);
      updateCurrentState('idle');
      try {
        deactivateKeepAwake('timer-active');
      } catch (e) {
        logger.log('Failed to deactivate keep awake:', e);
      }
      clearCurrentCommand();
      setElapsedTime(0);
    }
  }, [clearCurrentCommand, handleTimerEvent, updateCurrentState, updateCountdown]);

  const handleBack = useCallback(() => {
    console.log('[BaseTimerScreen] handleBack called - isRunning:', isRunning, 'programId:', programId);
    
    if (isRunning) {
      handleReset();
    }
    
    // For PPC programs, navigate back to PPC screen with selected discipline
    const program = ProgramManager.getProgram(programId);
    if (program && programId === 'ppc-standard') {
      const settings = (program as any).getSettings?.();
      const discipline = settings?.discipline;
      if (discipline) {
        navigation.navigate('PPC' as any, { selectedDiscipline: discipline });
        return;
      }
    }
    
    navigation.goBack();
  }, [handleReset, isRunning, navigation, programId]);

  const program = ProgramManager.getProgram(programId);
  const uiConfig = program?.getUIConfig();
  const backgroundColor = uiConfig?.backgroundColor || colors.background;
  const textColor = uiConfig?.textColor || colors.text;

  const displayContext: TimerDisplayContext = {
    currentState,
    countdown,
    isRunning,
    isPaused,
    backgroundColor,
    textColor,
  };

  const hasCustomStartControls = Boolean(adapterBindings.renderStartControls);
  const customStartControls = !isRunning && adapterBindings.renderStartControls
    ? adapterBindings.renderStartControls({
        startTimer: handleStart,
        isRunning,
        isPaused,
        currentState,
        currentCommand,
        countdown,
      })
    : null;
  const shouldShowDefaultStartButton = adapterBindings.showDefaultStartButton ?? !hasCustomStartControls;

  const showFullscreenDisplay = adapterBindings.showFullscreenDisplay
    ? adapterBindings.showFullscreenDisplay(displayContext)
    : false;

  const displayColor = adapterBindings.getDisplayColor
    ? adapterBindings.getDisplayColor(displayContext)
    : backgroundColor;

  const timerFontSize = adapterBindings.getTimerFontSize
    ? adapterBindings.getTimerFontSize(displayContext)
    : (() => {
        const value = countdown !== null ? countdown : 0;
        const digits = value.toString().length;
        if (digits >= 3) return 180;
        if (digits >= 2) return 240;
        return 240;
      })();

  const settingsBindings = adapterBindings.settings;

  const openSettings = useCallback(async () => {
    if (!settingsBindings) return;
    await Promise.resolve(settingsBindings.open());
  }, [settingsBindings]);

  return (
    <SafeAreaView style={[timerStyles.safeArea, { backgroundColor: colors.primary }]}> 
      <View style={timerStyles.container}>
        {!showFullscreenDisplay && (
          <Header
            title={program?.name || 'Timer'}
            onBackPress={handleBack}
          />
        )}

        {showFullscreenDisplay ? (
          <TouchableOpacity
            style={[timerStyles.fullscreenDisplay, { backgroundColor: displayColor }]}
            onPress={() => {
              // For PPC programs that are finished, navigate back instead of stopping
              if (programId === 'ppc-standard' && currentState === 'finished') {
                handleBack();
              } else if (isRunning && currentState !== 'finished') {
                // Show confirmation modal if timer is running
                setShowAbortConfirm(true);
              } else {
                handleStop();
              }
            }}
            activeOpacity={0.9}
          >
            {adapterBindings.renderFullscreenOverlay?.(displayContext)}
            <View pointerEvents="none" style={timerStyles.fullscreenTimerWrapper}>
              <Text
                style={[timerStyles.fullscreenTimer, {
                  color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF',
                  fontSize: timerFontSize,
                }]}
              >
                {countdown ?? 0}
              </Text>
            </View>
            {currentCommand && (
              <View pointerEvents="none" style={timerStyles.fullscreenCommandContainer}>
                <Text
                  style={[timerStyles.fullscreenCommand, { color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF' }]}
                >
                  {currentCommand}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : currentState === 'idle' ? (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={timerStyles.idleContainer}>
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
            <View style={[timerStyles.controls, timerStyles.controlsBottom]}>
              {!isRunning && settingsBindings?.showButton && (
                <TouchableOpacity
                  style={[timerStyles.button, timerStyles.settingsButton]}
                  onPress={openSettings}
                >
                  <Text style={timerStyles.buttonText}>
                    {settingsBindings.buttonLabel ?? 'Innstillinger'}
                  </Text>
                </TouchableOpacity>
              )}
              {!isRunning && customStartControls}
              {!isRunning && shouldShowDefaultStartButton && (
                <TouchableOpacity style={timerStyles.button} onPress={handleStart}>
                  <Text style={timerStyles.buttonText}>{t('controls.start')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {(() => {
              const shouldWrap = !isRunning && currentState === 'finished';
              console.log('[BaseTimerScreen] Render - isRunning:', isRunning, 'currentState:', currentState, 'shouldWrap:', shouldWrap);
              return shouldWrap ? (
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  activeOpacity={0.8}
                  onPress={() => {
                    console.log('[BaseTimerScreen] TouchableOpacity pressed on finished screen');
                    handleBack();
                  }}
                >
                  <TimerDisplay
                    time={elapsedTime}
                    state={currentState ? t(`states.${currentState}`) : t('states.idle')}
                    command={currentCommand}
                    countdown={countdown}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                  />
                </TouchableOpacity>
              ) : (
                <TimerDisplay
                  time={elapsedTime}
                  state={currentState ? t(`states.${currentState}`) : t('states.idle')}
                  command={currentCommand}
                  countdown={countdown}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                />
              );
            })()}
            <View style={[timerStyles.controls, timerStyles.controlsBottom]}>
              {!isRunning && settingsBindings?.showButton && (
                <TouchableOpacity
                  style={[timerStyles.button, timerStyles.settingsButton]}
                  onPress={openSettings}
                >
                  <Text style={timerStyles.buttonText}>
                    {settingsBindings.buttonLabel ?? 'Innstillinger'}
                  </Text>
                </TouchableOpacity>
              )}
              {!isRunning && customStartControls}
              {!isRunning && shouldShowDefaultStartButton && (
                <TouchableOpacity style={timerStyles.button} onPress={handleStart}>
                  <Text style={timerStyles.buttonText}>{t('controls.start')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <Modal
          visible={settingsBindings?.isVisible ?? false}
          transparent
          animationType="fade"
          onRequestClose={() => settingsBindings?.close()}
        >
          <View style={timerStyles.modalOverlay}>
            <View style={timerStyles.modalContent}>
              <Text style={timerStyles.modalTitle}>Innstillinger</Text>
              {settingsBindings?.renderContent?.()}
              <View style={timerStyles.modalButtons}>
                <TouchableOpacity
                  style={[timerStyles.button, timerStyles.modalButton]}
                  onPress={() => settingsBindings?.close()}
                >
                  <Text style={timerStyles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showAbortConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAbortConfirm(false)}
        >
          <View style={timerStyles.modalOverlay}>
            <View style={timerStyles.modalContent}>
              <Text style={timerStyles.modalTitle}>Avbryt timer?</Text>
              <View style={timerStyles.modalButtons}>
                <TouchableOpacity
                  style={[timerStyles.button, timerStyles.modalButton]}
                  onPress={handleAbort}
                >
                  <Text style={timerStyles.buttonText}>Ja</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[timerStyles.button, timerStyles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setShowAbortConfirm(false)}
                >
                  <Text style={timerStyles.buttonText}>Nei</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default BaseTimerScreen;
