import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [shootingDuration, setShootingDuration] = useState<number>(10);
  
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
      } catch (error) {
        console.error('Failed to load shooting duration:', error);
      }
    };
    loadSettings();
  }, []);

  // Save shooting duration when it changes
  const updateShootingDuration = async (duration: number) => {
    setShootingDuration(duration);
    try {
      await AsyncStorage.setItem('shootingDuration', duration.toString());
    } catch (error) {
      console.error('Failed to save shooting duration:', error);
    }
  };

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
      // Don't clear countdown - we want to keep showing it during shooting phase
      // Only speak in non-competition mode
      const program = ProgramManager.getProgram(programId);
      const settings = program?.getSettings();
      const isCompetitionMode = settings?.competitionMode || false;
      if (!isCompetitionMode) {
        AudioService.speak(translatedCommand);
      }
    }
    
    if (event.type === 'complete') {
      // Don't stop - keep showing the final state (red screen with 0)
      // User can tap screen to return
      setIsPaused(false);
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

  const handleStop = () => {
    if (timerEngineRef.current) {
      timerEngineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      setCountdown(null);
      setCurrentState('idle');
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
          <TouchableOpacity 
            style={[styles.fullscreenDisplay, { backgroundColor: getDisplayColor() }]}
            onPress={handleStop}
            activeOpacity={0.9}
          >
            <Text style={[styles.fullscreenTimer, { 
              color: currentState === 'prepare' ? '#2C3E50' : '#FFFFFF' 
            }]}>
              {countdown !== null ? countdown : 0}
            </Text>
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
                </Picker>
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
});
