import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface TimerDisplayProps {
  time: number; // milliseconds
  state?: string;
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

    // If time is 0, just show "0"
    if (milliseconds === 0) {
      return '0';
    }

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${ms.toString().padStart(2, '0')}`;
  };

  const getStateColor = (currentState?: string): string => {
    const s = (currentState || '').toLowerCase();
    if (s.includes('idle')) return colors.idle;
    if (s.includes('ready') || s.includes('prepare')) return colors.ready;
    if (s.includes('fire') || s.includes('green')) return colors.active;
    if (s.includes('cease') || s.includes('red')) return colors.cease;
    return colors.text;
  };

  const getCountdownColor = (value: number | null | undefined, currentState?: string): string => {
    if (value === null || value === undefined) {
      return colors.warning;
    }
    if (value < 0) {
      return colors.secondary;
    }
    if (value === 0) {
      return colors.danger;
    }
    const stateLabel = (currentState || '').toLowerCase();
    if (stateLabel.includes('shoot') || stateLabel.includes('fire')) {
      return colors.success;
    }
    if (stateLabel.includes('prepare') || stateLabel.includes('ready')) {
      return colors.warning;
    }
    return colors.success;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {countdown !== null && countdown !== undefined ? (
        // Show large countdown during prepare/fire phase with optional command text above
        <View style={styles.countdownSection}>
          {command && (
            <Text style={[styles.countdownCommand, { color: getCountdownColor(countdown, state) }]}>
              {command}
            </Text>
          )}
          <Text style={[styles.countdown, { color: getCountdownColor(countdown, state) }]}>
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
            {!(state || '').toLowerCase().includes('idle') && (
              <View style={[styles.stateIndicator, { backgroundColor: getStateColor(state) }]} />
            )}
            <Text style={[
              (state || '').toLowerCase().includes('idle') ? styles.stateIdle : styles.state,
              { color: textColor }
            ]}>
              {state || ''}
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
  countdownCommand: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
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
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
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
  stateIdle: {
    ...typography.h2,
    textTransform: 'none',
    width: '90%',
    textAlign: 'center',
  },
});
