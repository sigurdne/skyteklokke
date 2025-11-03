import { Platform, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const timerStyles = StyleSheet.create({
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
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
  fullscreenTimerWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenTimer: {
    fontSize: 240,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  fullscreenCommandContainer: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    left: spacing.lg,
    right: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCommand: {
    fontSize: 56,
    fontWeight: '700',
    textTransform: 'uppercase',
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
