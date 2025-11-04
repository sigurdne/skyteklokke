import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Audio } from 'expo-av';

import ProgramManager from '../../../services/ProgramManager';
import AudioService from '../../../services/AudioService';
import logger from '../../../utils/logger';
import { AudioClipMeta, loadClipMeta } from '../../../services/AudioClipService';
import { PPCProgram, PPCProgramSettings } from '../../../programs/ppc/PPCProgram';
import { PPCStage } from '../../../programs/ppc/stages';
import { colors, spacing, typography } from '../../../theme';
import { TimerEvent, TimingStep } from '../../../types';
import {
  TimerDisplayContext,
  TimerEventHelpers,
  TimerProgramAdapter,
  TimerProgramBindings,
  TimerSequenceContext,
} from '../BaseTimerScreen';

const COMMAND_CLIP_KEYS = {
  lade_hylstre: 'ppc_command_lade_hylstre',
  er_linja_klar: 'ppc_command_er_linja_klar',
  linja_er_klar: 'ppc_command_linja_er_klar',
} as const;

const BRIEFING_TITLE_FALLBACK_DELAY = 4500;
const BRIEFING_OVERVIEW_FALLBACK_DELAY = 6000;
const DURATION_PADDING_MS = 600;
const MANUAL_COMMAND_DELAY_MS = 250;
const COUNTDOWN_INTERVAL_MS = 1000;

type CommandClipMap = typeof COMMAND_CLIP_KEYS;
type CommandKey = keyof CommandClipMap;

const resolveStageClipKeys = (stage: PPCStage | null) => ({
  title: stage ? `ppc_stage_${stage.id}_title` : null,
  briefing: stage ? `ppc_stage_${stage.id}_briefing` : null,
});

const startControlsStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoSection: {
    marginBottom: spacing.md,
  },
  prompt: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  audioToggle: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  audioToggleIcon: {
    fontSize: 24,
  },
  list: {
    width: '100%',
    marginTop: spacing.sm,
  },
  commandButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandButtonActive: {
    borderColor: colors.primary,
  },
  commandButtonCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  commandButtonDisabled: {
    opacity: 0.6,
  },
  commandTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  commandTitleCompleted: {
    color: colors.background,
  },
  commandText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  commandTextCompleted: {
    color: colors.background,
  },
  commandStep: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  infoButton: {
    alignItems: 'flex-start',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    opacity: 1,
  },
  infoButtonDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 1,
  },
  infoButtonTitle: {
    color: colors.background,
    fontWeight: '700',
  },
  infoButtonTitleDisabled: {
    color: colors.text,
  },
  infoButtonText: {
    color: colors.background,
    opacity: 0.9,
  },
  infoButtonTextDisabled: {
    color: colors.textSecondary,
  },
  infoStatus: {
    ...typography.caption,
    color: colors.background,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});

export const ppcTimerAdapter: TimerProgramAdapter = {
  id: 'ppc-standard',
  useBindings: ({ programId, t }) => {
    const program = useMemo(
      () => ProgramManager.getProgram(programId) as PPCProgram | undefined,
      [programId],
    );

    const settings = program?.getSettings() as PPCProgramSettings | undefined;
    const currentStageId = settings?.currentStageId ?? null;
    const soundMode = settings?.soundMode ?? false;

    const stage = useMemo(() => {
      if (!program || !currentStageId) {
        return null;
      }
      return program.getStageDefinition(currentStageId) ?? null;
    }, [program, currentStageId]);

    const stageTextMap = useMemo(
      () => ({
        title: stage ? t(stage.titleKey, { defaultValue: stage.titleKey }) : '',
        briefing: stage ? t(stage.briefingKey, { defaultValue: stage.briefingKey }) : '',
      }),
      [stage, t],
    );

    const commandTextMap = useMemo(
      () => ({
        lade_hylstre: t('commands.lade_hylstre', { defaultValue: 'Lade, hylstre' }),
        er_linja_klar: t('commands.er_linja_klar', { defaultValue: 'Er linja klar?' }),
        linja_er_klar: t('commands.linja_er_klar', { defaultValue: 'Linja er klar' }),
      }),
      [t],
    );

    const lineReadyText = commandTextMap.linja_er_klar;

    const stageClipKeys = useMemo(() => resolveStageClipKeys(stage), [stage]);

    const clipCacheRef = useRef<Record<string, AudioClipMeta | null>>({});
    const soundRef = useRef<Audio.Sound | null>(null);
    const manualGateCompletedRef = useRef<boolean>(false);

    const [manualStep, setManualStep] = useState<number>(0);
    const [isManualBusy, setIsManualBusy] = useState<boolean>(false);
    const [hasStageTitleClip, setHasStageTitleClip] = useState<boolean>(false);
    const [hasStageBriefingClip, setHasStageBriefingClip] = useState<boolean>(false);
    const [stagePreviewBusy, setStagePreviewBusy] = useState<'title' | 'briefing' | null>(null);
    const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

    // Load audio enabled state on mount
    useEffect(() => {
      setAudioEnabled(AudioService.isAudioEnabled());
    }, []);

    const stopPlayback = useCallback(async () => {
      logger.info(`stopPlayback: soundRef.current=${soundRef.current ? 'exists' : 'null'}`);
      
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          logger.info('stopPlayback: Sound stopped');
        } catch (error) {
          logger.warn('Failed to stop PPC audio clip cleanly', error);
        }
        try {
          await soundRef.current.unloadAsync();
          logger.info('stopPlayback: Sound unloaded');
        } catch (error) {
          logger.warn('Failed to unload PPC audio clip', error);
        }
        soundRef.current = null;
      }

      try {
        await AudioService.stop();
        logger.info('stopPlayback: AudioService stopped');
      } catch (error) {
        logger.warn('Failed to stop TTS before PPC audio playback', error);
      }
    }, []);

    useEffect(() => {
      clipCacheRef.current = {};
      setManualStep(0);
      setIsManualBusy(false);
      setStagePreviewBusy(null);
      setHasStageTitleClip(false);
      setHasStageBriefingClip(false);
      manualGateCompletedRef.current = false;
    }, [programId, stage?.id]);

    useEffect(() => {
      return () => {
        stopPlayback().catch(() => undefined);
      };
    }, [stopPlayback]);

    const getClipMeta = useCallback(async (clipKey: string | null): Promise<AudioClipMeta | null> => {
      if (!clipKey) {
        return null;
      }
      if (clipCacheRef.current[clipKey] !== undefined) {
        return clipCacheRef.current[clipKey];
      }
      const meta = await loadClipMeta(clipKey);
      clipCacheRef.current[clipKey] = meta;
      return meta;
    }, []);

    useEffect(() => {
      let cancelled = false;

      const evaluateStageClips = async () => {
        logger.info(`evaluateStageClips: titleKey=${stageClipKeys.title}, briefingKey=${stageClipKeys.briefing}`);
        
        if (!stageClipKeys.title && !stageClipKeys.briefing) {
          if (!cancelled) {
            setHasStageTitleClip(false);
            setHasStageBriefingClip(false);
          }
          return;
        }

        try {
          const [titleMeta, briefingMeta] = await Promise.all([
            getClipMeta(stageClipKeys.title),
            getClipMeta(stageClipKeys.briefing),
          ]);

          logger.info(`evaluateStageClips: titleMeta=${JSON.stringify(titleMeta)}, briefingMeta=${JSON.stringify(briefingMeta)}`);

          if (!cancelled) {
            const hasTitleClip = Boolean(titleMeta?.uri);
            const hasBriefingClip = Boolean(briefingMeta?.uri);
            logger.info(`evaluateStageClips: Setting hasTitleClip=${hasTitleClip}, hasBriefingClip=${hasBriefingClip}`);
            setHasStageTitleClip(hasTitleClip);
            setHasStageBriefingClip(hasBriefingClip);
          }
        } catch (error) {
          logger.warn('Failed to inspect stage clips for availability', error);
          if (!cancelled) {
            setHasStageTitleClip(false);
            setHasStageBriefingClip(false);
          }
        }
      };

      evaluateStageClips().catch(() => undefined);

      return () => {
        cancelled = true;
      };
    }, [getClipMeta, stageClipKeys.briefing, stageClipKeys.title]);

    const playClipWithFallback = useCallback(
      async (clipKey: string | null, _fallbackText: string) => {
        logger.info(`playClipWithFallback: clipKey=${clipKey}, audioEnabled=${audioEnabled}`);
        
        if (!audioEnabled) {
          return false;
        }

        await stopPlayback();

        try {
          const meta = await getClipMeta(clipKey);
          logger.info(`playClipWithFallback: meta=${JSON.stringify(meta)}`);
          
          if (meta?.uri) {
            logger.info(`playClipWithFallback: Creating sound from uri=${meta.uri}`);
            const { sound } = await Audio.Sound.createAsync({ uri: meta.uri });
            soundRef.current = sound;
            sound.setOnPlaybackStatusUpdate((status) => {
              if (!status.isLoaded) {
                return;
              }
              if (status.didJustFinish || status.positionMillis >= (status.durationMillis ?? Number.MAX_SAFE_INTEGER)) {
                sound.unloadAsync().catch(() => undefined);
                if (soundRef.current === sound) {
                  soundRef.current = null;
                }
              }
            });
            await sound.playAsync();
            return true;
          }
        } catch (error) {
          logger.warn('Failed to play PPC audio clip, falling back to TTS', error);
        }

        return false;
      },
      [audioEnabled, getClipMeta, stopPlayback],
    );

    const playRecordedClip = useCallback(
      async (clipKey: string | null) => {
        logger.info(`playRecordedClip: clipKey=${clipKey}, audioEnabled=${audioEnabled}`);
        
        if (!clipKey) {
          logger.warn('playRecordedClip: No clipKey provided');
          return false;
        }

        if (!audioEnabled) {
          logger.info('playRecordedClip: Audio disabled, skipping');
          return false;
        }

        await stopPlayback();

        try {
          const meta = await getClipMeta(clipKey);
          logger.info(`playRecordedClip: meta=${JSON.stringify(meta)}`);
          
          if (meta?.uri) {
            logger.info(`playRecordedClip: Creating sound from uri=${meta.uri}`);
            const { sound } = await Audio.Sound.createAsync({ uri: meta.uri });
            soundRef.current = sound;
            sound.setOnPlaybackStatusUpdate((status) => {
              if (!status.isLoaded) {
                return;
              }
              if (status.didJustFinish || status.positionMillis >= (status.durationMillis ?? Number.MAX_SAFE_INTEGER)) {
                sound.unloadAsync().catch(() => undefined);
                if (soundRef.current === sound) {
                  soundRef.current = null;
                }
              }
            });
            logger.info('playRecordedClip: Playing sound...');
            await sound.playAsync();
            logger.info('playRecordedClip: Sound playing successfully');
            return true;
          } else {
            logger.warn('playRecordedClip: No URI in meta');
          }
        } catch (error) {
          logger.warn('Failed to play recorded stage clip', error);
        }

        return false;
      },
      [audioEnabled, getClipMeta, stopPlayback],
    );

    const handleCommandEvent = useCallback(
      async (command: string, helpers: TimerEventHelpers) => {
        if (!command) {
          return false;
        }

        if (command === 'beep' || command === 'continuous_beep') {
          await stopPlayback();
          return false;
        }

        // Briefing and manual commands are no longer in the sequence
        // They are handled entirely by the UI tiles and buttons before timer starts

        return false;
      },
      [stopPlayback],
    );

    const handleTimerEvent = useCallback(
      async (event: TimerEvent, helpers: TimerEventHelpers) => {
        if (event.type === 'state_change') {
          const nextState = event.state || 'idle';
          if (nextState === 'idle' || nextState === 'finished') {
            helpers.clearCurrentCommand();
            await stopPlayback();
            manualGateCompletedRef.current = false;
            setManualStep(0);
            setIsManualBusy(false);
          }
          return false;
        }

        if (event.type === 'countdown') {
          const countdownValue = event.countdown ?? null;
          if (countdownValue === null) {
            return false;
          }

          // Clear any command text during countdown
          helpers.clearCurrentCommand();
          return false;
        }

        if (event.type === 'command' && event.command) {
          const handled = await handleCommandEvent(event.command, helpers);
          if (handled) {
            return true;
          }
          return false;
        }

        if (event.type === 'reset' || event.type === 'complete') {
          await stopPlayback();
          manualGateCompletedRef.current = false;
          setManualStep(0);
          setIsManualBusy(false);
        }

        return false;
      },
      [handleCommandEvent, lineReadyText, manualGateCompletedRef, stopPlayback],
    );

    const resetManualFlow = useCallback(() => {
      setManualStep(0);
      setIsManualBusy(false);
      manualGateCompletedRef.current = false;
      void stopPlayback();
    }, [stopPlayback]);

    const adjustSequence = useCallback(
      async (sequence: TimingStep[], _context: TimerSequenceContext) => {
        // Sequence already starts at countdown -3, no adjustments needed
        // Briefing and manual commands are handled entirely by UI before timer starts
        return sequence;
      },
      [],
    );

    const renderStartControls = useCallback(
      ({ startTimer, isRunning }: { startTimer: () => Promise<void>; isRunning: boolean }) => {
        if (isRunning) {
          return null;
        }

        const manualPrompt = t('ppc.timer.manual_prompt', {
          defaultValue: 'Trykk kommandoene i rekkefølge for å starte',
        });

        const toggleAudio = () => {
          const newState = !audioEnabled;
          setAudioEnabled(newState);
          AudioService.setEnabled(newState);
        };

        const infoButtons: Array<{
          key: 'title' | 'briefing';
          label: string;
          text: string;
          clipKey: string | null;
          hasClip: boolean;
        }> = [
          {
            key: 'title',
            label: t('ppc.detail.stage_title_label'),
            text: stageTextMap.title,
            clipKey: stageClipKeys.title,
            hasClip: hasStageTitleClip,
          },
          {
            key: 'briefing',
            label: t('ppc.detail.stage_briefing_label'),
            text: stageTextMap.briefing,
            clipKey: stageClipKeys.briefing,
            hasClip: hasStageBriefingClip,
          },
        ];

        const handleInfoPress = async (button: (typeof infoButtons)[number]) => {
          logger.info(`handleInfoPress: key=${button.key}, hasClip=${button.hasClip}, clipKey=${button.clipKey}, busy=${stagePreviewBusy}`);
          
          if (!button.hasClip || stagePreviewBusy) {
            logger.warn(`handleInfoPress: Skipping - hasClip=${button.hasClip}, busy=${stagePreviewBusy}`);
            return;
          }

          setStagePreviewBusy(button.key);
          try {
            logger.info(`handleInfoPress: Calling playRecordedClip with clipKey=${button.clipKey}`);
            const result = await playRecordedClip(button.clipKey);
            logger.info(`handleInfoPress: playRecordedClip returned ${result}`);
          } finally {
            setStagePreviewBusy(null);
          }
        };

        const buttons: Array<{ command: CommandKey; label: string; description: string; stepIndex: number }> = [
          {
            command: 'lade_hylstre',
            label: t('ppc.detail.command_prepare_label'),
            description: commandTextMap.lade_hylstre,
            stepIndex: 0,
          },
          {
            command: 'er_linja_klar',
            label: t('ppc.detail.command_line_ready_query_label'),
            description: commandTextMap.er_linja_klar,
            stepIndex: 1,
          },
          {
            command: 'linja_er_klar',
            label: t('ppc.detail.command_line_ready_label'),
            description: commandTextMap.linja_er_klar,
            stepIndex: 2,
          },
        ];

        const handleManualPress = async (button: { command: CommandKey; stepIndex: number }) => {
          if (isManualBusy) {
            return;
          }

          if (manualStep < button.stepIndex) {
            return;
          }

          setIsManualBusy(true);
          try {
            const spokenText = commandTextMap[button.command] ?? button.command;
            const clipKey = COMMAND_CLIP_KEYS[button.command];
            logger.info(`handleManualPress: command=${button.command}, clipKey=${clipKey}, spokenText=${spokenText}`);
            
            const isExpectedStep = manualStep === button.stepIndex;
            const isFinalCommand = button.command === 'linja_er_klar';

            // For the final command (linja_er_klar), check if there's a recording and if audio is enabled
            if (isExpectedStep && isFinalCommand) {
              const meta = await getClipMeta(clipKey);
              const hasRecording = Boolean(meta?.uri);
              
              logger.info(`handleManualPress: isFinalCommand, hasRecording=${hasRecording}, audioEnabled=${audioEnabled}, meta=${JSON.stringify(meta)}`);

              // Only wait for recording if audio is enabled AND there's a recording
              if (audioEnabled && hasRecording) {
                // Play the recording and wait for it to complete
                try {
                  await playClipWithFallback(clipKey, spokenText);
                  const waitTime = meta?.durationMs ? meta.durationMs + 200 : 3000;
                  logger.info(`handleManualPress: Waiting ${waitTime}ms for audio to complete`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                } catch (playError) {
                  logger.warn('Manual command playback error', playError);
                }
              } else {
                // No recording or audio disabled, start timer immediately without waiting
                logger.info('handleManualPress: No recording found or audio disabled, starting timer immediately');
              }

              // Start the timer
              setManualStep(button.stepIndex + 1);
              manualGateCompletedRef.current = true;
              try {
                await startTimer();
              } catch (startError) {
                manualGateCompletedRef.current = false;
                setManualStep(button.stepIndex);
                logger.error('Failed to start PPC timer after manual commands', startError);
              }
            } else {
              // For non-final commands, just play the audio normally (will be skipped if audio disabled)
              try {
                await playClipWithFallback(clipKey, spokenText);
              } catch (playError) {
                logger.warn('Manual command playback error', playError);
              }

              if (isExpectedStep) {
                setManualStep(button.stepIndex + 1);
              }
            }
          } catch (sequenceError) {
            logger.error('Manual start sequence error', sequenceError);
          } finally {
            setIsManualBusy(false);
          }
        };

        return (
          <ScrollView 
            style={startControlsStyles.scrollContainer}
            contentContainerStyle={startControlsStyles.container}
            showsVerticalScrollIndicator={true}
          >
            <View style={startControlsStyles.headerRow}>
              <Text style={startControlsStyles.prompt}>{manualPrompt}</Text>
              <TouchableOpacity
                style={startControlsStyles.audioToggle}
                onPress={toggleAudio}
                activeOpacity={0.7}
              >
                <Text style={startControlsStyles.audioToggleIcon}>
                  {audioEnabled ? '🔊' : '🔇'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={startControlsStyles.infoSection}>
              {infoButtons.map((button) => {
                const disabled = !button.hasClip || Boolean(stagePreviewBusy);
                return (
                  <TouchableOpacity
                    key={button.key}
                    style={[
                      startControlsStyles.commandButton,
                      startControlsStyles.infoButton,
                      disabled && startControlsStyles.infoButtonDisabled,
                    ]}
                    onPress={() => handleInfoPress(button)}
                    disabled={disabled}
                  >
                    <Text style={[
                      startControlsStyles.commandTitle,
                      startControlsStyles.infoButtonTitle,
                      disabled && startControlsStyles.infoButtonTitleDisabled,
                    ]}>
                      {button.label}
                    </Text>
                    <Text style={[
                      startControlsStyles.commandText,
                      startControlsStyles.infoButtonText,
                      disabled && startControlsStyles.infoButtonTextDisabled,
                    ]}>
                      {button.text}
                    </Text>
                    {!button.hasClip && (
                      <Text style={startControlsStyles.infoStatus}>{t('ppc.detail.no_recording')}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={startControlsStyles.list}>
              {buttons.map((button) => {
                const completed = manualStep > button.stepIndex;
                const isActive = manualStep === button.stepIndex;
                const disabled = isManualBusy || manualStep < button.stepIndex;

                const titleStyle = [
                  startControlsStyles.commandTitle,
                  completed && startControlsStyles.commandTitleCompleted,
                ];
                const descriptionStyle = [
                  startControlsStyles.commandText,
                  completed && startControlsStyles.commandTextCompleted,
                ];

                return (
                  <TouchableOpacity
                    key={button.command}
                    style={[
                      startControlsStyles.commandButton,
                      isActive && startControlsStyles.commandButtonActive,
                      completed && startControlsStyles.commandButtonCompleted,
                      disabled && startControlsStyles.commandButtonDisabled,
                    ]}
                    onPress={() => handleManualPress(button)}
                    disabled={disabled}
                  >
                    <Text style={titleStyle}>{button.label}</Text>
                    <Text style={descriptionStyle}>{button.description}</Text>
                    <Text style={startControlsStyles.commandStep}>{`${button.stepIndex + 1}/3`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {manualStep > 0 && manualStep < 3 && (
              <TouchableOpacity
                style={startControlsStyles.resetButton}
                onPress={resetManualFlow}
                disabled={isManualBusy}
              >
                <Text style={startControlsStyles.resetButtonText}>
                  {t('ppc.timer.manual_reset', { defaultValue: 'Start på nytt' })}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        );
      },
      [
        audioEnabled,
        commandTextMap,
        hasStageBriefingClip,
        hasStageTitleClip,
        isManualBusy,
        manualGateCompletedRef,
        manualStep,
        playClipWithFallback,
        playRecordedClip,
        resetManualFlow,
        stageClipKeys.briefing,
        stageClipKeys.title,
        stagePreviewBusy,
        stageTextMap,
        t,
      ],
    );

    const beforeTimerStart: TimerProgramBindings['beforeTimerStart'] = useCallback(async () => {
      clipCacheRef.current = {};
      await stopPlayback();

      if (!soundMode) {
        return;
      }

      const keysToPrime = new Set<string>();
      Object.values(COMMAND_CLIP_KEYS).forEach((key) => keysToPrime.add(key));
      if (stageClipKeys.title) {
        keysToPrime.add(stageClipKeys.title);
      }
      if (stageClipKeys.briefing) {
        keysToPrime.add(stageClipKeys.briefing);
      }

      await Promise.all(
        Array.from(keysToPrime).map((key) =>
          getClipMeta(key).catch((error) => {
            logger.warn('Failed to pre-load PPC clip metadata', error);
            return null;
          }),
        ),
      );
    }, [getClipMeta, soundMode, stageClipKeys, stopPlayback]);

    const getDisplayColor = useCallback((context: TimerDisplayContext) => {
      if (context.currentState === 'prestart') {
        return colors.warning;
      }
      if (context.currentState === 'shooting') {
        return colors.success;
      }
      if (context.currentState === 'finished') {
        return colors.danger;
      }
      if (context.currentState === 'briefing') {
        return colors.primary;
      }
      return context.backgroundColor;
    }, []);

    const showFullscreenDisplay = useCallback(
      (context: TimerDisplayContext) => context.isRunning || context.currentState === 'finished',
      []
    );

    const cleanup = useCallback(() => {
      resetManualFlow();
    }, [resetManualFlow]);

    const bindings: TimerProgramBindings = {
      beforeTimerStart,
      adjustSequence,
      handleTimerEvent,
      getDisplayColor,
      showFullscreenDisplay,
      cleanup,
      renderStartControls,
      showDefaultStartButton: false,
    };

    return bindings;
  },
};

export default ppcTimerAdapter;
