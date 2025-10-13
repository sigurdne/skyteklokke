import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
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
  
  const timerEngineRef = useRef<TimerEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize program and timer engine
    const program = ProgramManager.getProgram(programId);
    if (!program) {
      navigation.goBack();
      return;
    }

    ProgramManager.setActiveProgram(programId);
    const sequence = program.getTimingSequence();
    timerEngineRef.current = new TimerEngine(sequence);

    // Setup audio service
    AudioService.setLanguage(i18n.language as any);

    // Add event listener
    const handleTimerEvent = (event: TimerEvent) => {
      if (event.type === 'state_change') {
        setCurrentState(event.state || 'idle');
      }
      
      if (event.type === 'command' && event.command) {
        const translatedCommand = t(`commands.${event.command}`);
        setCurrentCommand(translatedCommand);
        AudioService.speak(translatedCommand);
      }
      
      if (event.type === 'complete') {
        setIsRunning(false);
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
      }
    };

    timerEngineRef.current.addEventListener(handleTimerEvent);

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
  }, [programId, navigation, t, i18n.language]);

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
    if (timerEngineRef.current && !isRunning) {
      timerEngineRef.current.start();
      setIsRunning(true);
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

  // For duel program, show fullscreen light display
  const isDuelProgram = programId === 'standard-duel';
  const showLightDisplay = isDuelProgram && isRunning;

  const getLightColor = (): string => {
    if (currentState.includes('red')) return colors.redLight;
    if (currentState.includes('green')) return colors.greenLight;
    return backgroundColor;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primary }]}>
      <View style={styles.container}>
        {!showLightDisplay && (
          <Header
            title={program?.name || 'Timer'}
            onBackPress={handleBack}
          />
        )}
        
        {showLightDisplay ? (
          <View style={[styles.lightDisplay, { backgroundColor: getLightColor() }]}>
            <Text style={[styles.lightTimer, { color: '#FFFFFF' }]}>
              {Math.floor(elapsedTime / 1000)}s
            </Text>
            {currentState && (
              <Text style={[styles.lightState, { color: '#FFFFFF' }]}>
                {t(`states.${currentState}`)}
              </Text>
            )}
          </View>
        ) : (
          <TimerDisplay
            time={elapsedTime}
            state={currentState ? t(`states.${currentState}`) : t('states.idle')}
            command={currentCommand}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        )}

        <View style={styles.controls}>
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
});
