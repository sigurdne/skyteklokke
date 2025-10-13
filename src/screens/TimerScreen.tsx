import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [shootingDuration, setShootingDuration] = useState<number>(25);
  
  const timerEngineRef = useRef<TimerEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeTimer = () => {
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      return null;
    }

    // Update program settings with custom shooting duration for field program
    if (programId === 'standard-field') {
      program.updateSettings({ shootingDuration });
    }

    const sequence = program.getTimingSequence();
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
  const handleTimerEvent = (event: TimerEvent) => {
    if (event.type === 'state_change') {
      setCurrentState(event.state || 'idle');
    }

    if (event.type === 'countdown') {
      setCountdown(event.countdown || null);
    }
    
    if (event.type === 'command' && event.command) {
      const translatedCommand = t(`commands.${event.command}`);
      setCurrentCommand(translatedCommand);
      setCountdown(null); // Clear countdown when command is issued
      AudioService.speak(translatedCommand);
    }
    
    if (event.type === 'complete') {
      setIsRunning(false);
      setIsPaused(false);
      setCountdown(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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

  const handleStart = () => {
    if (!isRunning) {
      // Initialize timer engine with current settings
      const engine = initializeTimer();
      if (engine) {
        timerEngineRef.current = engine;
        timerEngineRef.current.addEventListener(handleTimerEvent);
        timerEngineRef.current.start();
        setIsRunning(true);
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
      timerEngineRef.current.reset();
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
      if (currentState.includes('red')) return colors.redLight;
      if (currentState.includes('green')) return colors.greenLight;
    }
    
    return backgroundColor;
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
          <View style={[styles.fullscreenDisplay, { backgroundColor: getDisplayColor() }]}>
            <Text style={[styles.fullscreenTimer, { 
              color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF' 
            }]}>
              {countdown !== null ? countdown : Math.floor(elapsedTime / 1000)}
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
        )}

        <View style={styles.controls}>
          {!isRunning && isFieldProgram && (
            <TouchableOpacity 
              style={[styles.button, styles.settingsButton]} 
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.buttonText}>⚙️ {shootingDuration}s</Text>
            </TouchableOpacity>
          )}
          {!isRunning && (
            <TouchableOpacity style={styles.button} onPress={handleStart}>
              <Text style={styles.buttonText}>{t('controls.start')}</Text>
            </TouchableOpacity>
          )}
          {isRunning && !isPaused && (
            <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
              <Text style={styles.buttonText}>{t('controls.pause')}</Text>
            </TouchableOpacity>
          )}
          {isRunning && isPaused && (
            <TouchableOpacity style={[styles.button, styles.resumeButton]} onPress={handleResume}>
              <Text style={styles.buttonText}>{t('controls.resume')}</Text>
            </TouchableOpacity>
          )}
          {isRunning && (
            <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
              <Text style={styles.buttonText}>{t('controls.reset')}</Text>
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
              <Text style={styles.modalTitle}>Skytingens varighet</Text>
              <Text style={styles.modalSubtitle}>
                (etter 10 sekunders forberedelse)
              </Text>
              
              <View style={styles.durationSelector}>
                {[10, 15, 20, 25, 30, 45, 60].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      shootingDuration === duration && styles.durationButtonActive
                    ]}
                    onPress={() => setShootingDuration(duration)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      shootingDuration === duration && styles.durationButtonTextActive
                    ]}>
                      {duration}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.secondary,
    marginBottom: spacing.lg,
  },
  durationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 80,
  },
  durationButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  durationButtonText: {
    ...typography.button,
    color: colors.text,
    textAlign: 'center',
  },
  durationButtonTextActive: {
    color: colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    minWidth: 150,
  },
});
