import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface TimerDisplayProps {
  time: number; // milliseconds
  state: string;
  command?: string;
  countdown?: number | null;
  backgroundColor?: string;
  textColor?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  time,
  state,
  command,
  countdown,
  backgroundColor = colors.background,
  textColor = colors.text,
}) => {
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${ms.toString().padStart(2, '0')}`;
  };

  const getStateColor = (currentState: string): string => {
    if (currentState.includes('idle')) return colors.idle;
    if (currentState.includes('ready') || currentState.includes('prepare')) return colors.ready;
    if (currentState.includes('fire') || currentState.includes('green')) return colors.active;
    if (currentState.includes('cease') || currentState.includes('red')) return colors.cease;
    return colors.text;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {countdown !== null && countdown !== undefined ? (
        // Show large countdown during prepare phase
        <View style={styles.countdownSection}>
          <Text style={[styles.countdown, { color: colors.warning }]}>
            {countdown}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.timerSection}>
            <Text style={[styles.timer, { color: textColor }]}>
              {formatTime(time)}
            </Text>
          </View>
          {command && (
            <View style={styles.commandSection}>
              <Text style={[styles.command, { color: getStateColor(state) }]}>
                {command}
              </Text>
            </View>
          )}
          <View style={styles.stateSection}>
            <View style={[styles.stateIndicator, { backgroundColor: getStateColor(state) }]} />
            <Text style={[styles.state, { color: textColor }]}>
              {state}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  countdownSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdown: {
    fontSize: 200,
    fontWeight: '900',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  timerSection: {
    marginBottom: spacing.xl,
  },
  timer: {
    ...typography.timer,
    textAlign: 'center',
  },
  commandSection: {
    marginBottom: spacing.lg,
    minHeight: 60,
  },
  command: {
    ...typography.command,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  stateIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  state: {
    ...typography.body,
    textTransform: 'capitalize',
  },
});
