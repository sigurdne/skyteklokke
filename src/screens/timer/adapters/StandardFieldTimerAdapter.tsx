import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import AudioService from '../../../services/AudioService';
import * as CustomAudio from '../../../services/CustomAudioService';
import logger from '../../../utils/logger';
import { loadNumber, loadBoolean, saveNumber, saveBoolean } from '../../../utils/asyncStorageHelpers';
import { TimerEvent, TimingStep } from '../../../types';
import { colors, spacing } from '../../../theme';
import { timerStyles } from '../timerStyles';
import { TimerDisplayContext, TimerEventHelpers, TimerProgramAdapter, TimerProgramBindings, TimerProgramSettingsBindings, TimerSequenceContext } from '../BaseTimerScreen';

const initialPhaseStatuses: Record<CustomAudio.PhaseKey, { enabled: boolean; hasFile: boolean; offset: number }> = {
  shooters_ready: { enabled: false, hasFile: false, offset: 0 },
  ready_command: { enabled: false, hasFile: false, offset: 0 },
  fire_command: { enabled: false, hasFile: false, offset: 0 },
  cease_command: { enabled: false, hasFile: false, offset: 0 },
};

const SOUND_MODE_KEY = 'soundMode';
const SHOOTING_DURATION_KEY = 'shootingDuration';

export const standardFieldTimerAdapter: TimerProgramAdapter = {
  id: 'standard-field',
  useBindings: ({ programId, t }) => {
    const [shootingDuration, setShootingDuration] = useState<number>(10);
    const [soundMode, setSoundMode] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [phaseStatuses, setPhaseStatuses] = useState(initialPhaseStatuses);
    const [recordingPhase, setRecordingPhase] = useState<CustomAudio.PhaseKey | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);

    useEffect(() => {
      const loadSettings = async () => {
        const duration = await loadNumber(SHOOTING_DURATION_KEY);
        if (duration !== undefined) {
          setShootingDuration(duration);
        }
        
        const soundMode = await loadBoolean(SOUND_MODE_KEY);
        if (soundMode !== undefined) {
          setSoundMode(soundMode);
        }
      };

      loadSettings();
    }, []);

    const updateShootingDuration = useCallback(async (duration: number) => {
      setShootingDuration(duration);
      await saveNumber(SHOOTING_DURATION_KEY, duration);
    }, []);

    const updateSoundMode = useCallback(async (enabled: boolean) => {
      setSoundMode(enabled);
      await saveBoolean(SOUND_MODE_KEY, enabled);
    }, []);

    const loadPhaseStatuses = useCallback(async () => {
      try {
        const statuses = await CustomAudio.getPhaseStatuses(programId);
        setPhaseStatuses(statuses);
      } catch (error) {
        logger.error('Failed to load phase statuses:', error);
      }
    }, [programId]);

    useEffect(() => {
      if (showSettings && soundMode) {
        loadPhaseStatuses();
      }
    }, [showSettings, soundMode, loadPhaseStatuses]);

    const settingsBindings: TimerProgramSettingsBindings = {
      showButton: true,
      buttonLabel: `⚙️ ${shootingDuration}s`,
      open: async () => {
        setShowSettings(true);
        if (soundMode) {
          await loadPhaseStatuses();
        }
      },
      close: () => {
        setShowSettings(false);
        if (isRecording) {
          CustomAudio.cancelRecording().catch((error) => logger.error('Cancel recording failed:', error));
          setIsRecording(false);
          setRecordingPhase(null);
        }
      },
      isVisible: showSettings,
      renderContent: () => (
        <>
          <View style={timerStyles.settingRow}>
            <Text style={timerStyles.settingLabel}>lydmodus</Text>
            <TouchableOpacity
              style={[timerStyles.toggle, soundMode && timerStyles.toggleActive]}
              onPress={() => updateSoundMode(!soundMode)}
            >
              <View style={[timerStyles.toggleThumb, soundMode && timerStyles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <Text style={timerStyles.settingDescription}>
            {soundMode ? 'innspilte kommandoer' : 'ingen lyd, kun visuelle signaler'}
          </Text>

          <Text style={timerStyles.modalSubtitle}>Skytetid</Text>
          <View style={timerStyles.pickerContainer}>
            <Picker
              selectedValue={shootingDuration}
              onValueChange={(value) => updateShootingDuration(value)}
              style={timerStyles.picker}
              itemStyle={timerStyles.pickerItem}
            >
              {Array.from({ length: 11 }, (_, i) => 4 + i * 2).map((duration) => (
                <Picker.Item key={duration} label={`${duration} sekunder`} value={duration} />
              ))}
              <Picker.Item key={150} label="150 sekunder" value={150} />
            </Picker>
          </View>

          {soundMode && (
            <>
              <Text style={[timerStyles.modalSubtitle, { marginTop: spacing.lg }]}>Egendefinerte opptak</Text>
              <Text style={[timerStyles.settingDescription, { marginBottom: spacing.md }]}>
                Ta opp dine egne kommandoer for hver fase
              </Text>

              <ScrollView style={{ maxHeight: 300 }}>
                {CustomAudio.getAllPhases().map((phase) => {
                  const status = phaseStatuses[phase];
                  const isRecordingThis = isRecording && recordingPhase === phase;

                  return (
                    <View key={phase} style={timerStyles.phaseCard}>
                      <View style={timerStyles.phaseHeader}>
                        <Text style={timerStyles.phaseLabel}>{CustomAudio.getPhaseLabel(phase)}</Text>
                        <TouchableOpacity
                          style={[timerStyles.smallToggle, status.enabled && timerStyles.toggleActive]}
                          onPress={async () => {
                            const newEnabled = !status.enabled;
                            await CustomAudio.setEnabled(programId, phase, newEnabled);
                            await loadPhaseStatuses();
                          }}
                          disabled={!status.hasFile}
                        >
                          <View style={[timerStyles.smallToggleThumb, status.enabled && timerStyles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>

                      <View style={timerStyles.phaseButtons}>
                        {!isRecordingThis ? (
                          <>
                            <TouchableOpacity
                              style={[timerStyles.phaseButton, timerStyles.recordButton]}
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
                              <Text style={timerStyles.phaseButtonText}>🎙️ Ta opp</Text>
                            </TouchableOpacity>

                            {status.hasFile && (
                              <>
                                <TouchableOpacity
                                  style={[timerStyles.phaseButton, timerStyles.playButton]}
                                  onPress={async () => {
                                    try {
                                      await CustomAudio.playIfEnabled(programId, phase);
                                    } catch (error) {
                                      logger.error('Play error:', error);
                                    }
                                  }}
                                >
                                  <Text style={timerStyles.phaseButtonText}>▶️ Test</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[timerStyles.phaseButton, timerStyles.deleteButton]}
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
                                  <Text style={timerStyles.phaseButtonText}>🗑️</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[timerStyles.phaseButton, timerStyles.stopButton]}
                              onPress={async () => {
                                try {
                                  await CustomAudio.stopRecording(programId, phase);
                                  setIsRecording(false);
                                  setRecordingPhase(null);
                                  await loadPhaseStatuses();
                                  await CustomAudio.setEnabled(programId, phase, true);
                                  await loadPhaseStatuses();
                                } catch (error) {
                                  logger.error('Stop recording error:', error);
                                  Alert.alert('Feil', 'Kunne ikke lagre opptak');
                                }
                              }}
                            >
                              <Text style={timerStyles.phaseButtonText}>⏹️ Stopp og lagre</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[timerStyles.phaseButton, timerStyles.cancelButton]}
                              onPress={async () => {
                                await CustomAudio.cancelRecording();
                                setIsRecording(false);
                                setRecordingPhase(null);
                              }}
                            >
                              <Text style={timerStyles.phaseButtonText}>❌ Avbryt</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>

                      {!status.hasFile && !isRecordingThis && (
                        <Text style={timerStyles.phaseHint}>Ingen opptak ennå</Text>
                      )}
                      {isRecordingThis && (
                        <Text style={[timerStyles.phaseHint, { color: colors.danger }]}>● Tar opp...</Text>
                      )}

                      {status.hasFile && !isRecordingThis && (
                        <View style={timerStyles.offsetContainer}>
                          <Text style={timerStyles.offsetLabel}>Tidsforskyvning: {status.offset}ms</Text>
                          <View style={timerStyles.offsetButtons}>
                            <TouchableOpacity
                              style={timerStyles.offsetButton}
                              onPress={async () => {
                                const newOffset = status.offset - 100;
                                await CustomAudio.setOffset(programId, phase, newOffset);
                                await loadPhaseStatuses();
                              }}
                            >
                              <Text style={timerStyles.offsetButtonText}>-100ms</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={timerStyles.offsetButton}
                              onPress={async () => {
                                const newOffset = status.offset - 50;
                                await CustomAudio.setOffset(programId, phase, newOffset);
                                await loadPhaseStatuses();
                              }}
                            >
                              <Text style={timerStyles.offsetButtonText}>-50ms</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={timerStyles.offsetButton}
                              onPress={async () => {
                                await CustomAudio.setOffset(programId, phase, 0);
                                await loadPhaseStatuses();
                              }}
                            >
                              <Text style={timerStyles.offsetButtonText}>0</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={timerStyles.offsetButton}
                              onPress={async () => {
                                const newOffset = status.offset + 50;
                                await CustomAudio.setOffset(programId, phase, newOffset);
                                await loadPhaseStatuses();
                              }}
                            >
                              <Text style={timerStyles.offsetButtonText}>+50ms</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={timerStyles.offsetButton}
                              onPress={async () => {
                                const newOffset = status.offset + 100;
                                await CustomAudio.setOffset(programId, phase, newOffset);
                                await loadPhaseStatuses();
                              }}
                            >
                              <Text style={timerStyles.offsetButtonText}>+100ms</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={timerStyles.offsetHint}>
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
      ),
    };

    const beforeTimerStart: TimerProgramBindings['beforeTimerStart'] = async (program) => {
      program.updateSettings({
        shootingDuration,
        soundMode,
        competitionMode: !soundMode,
      });
    };

    const adjustSequence: TimerProgramBindings['adjustSequence'] = async (sequence, _context: TimerSequenceContext) => {
      if (!soundMode) {
        return;
      }

      const shootersReadyStep = sequence.find((step) => step.id === 'shooters_ready');
      if (shootersReadyStep) {
        const duration = await CustomAudio.getRecordingDuration(programId, 'shooters_ready');
        const offset = await CustomAudio.getOffset(programId, 'shooters_ready');
        if (duration > 0) {
          shootersReadyStep.delay = duration + 500 + offset;
          logger.log(`Adjusted shooters_ready delay to ${shootersReadyStep.delay}ms (offset: ${offset}ms)`);
        } else {
          shootersReadyStep.delay = 3000 + offset;
        }
      }

      const readyCommandOffset = await CustomAudio.getOffset(programId, 'ready_command');
      const fireCommandOffset = await CustomAudio.getOffset(programId, 'fire_command');
      const ceaseCommandOffset = await CustomAudio.getOffset(programId, 'cease_command');

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
        const prePlayStep: TimingStep = {
          id: prePlayId,
          state: prePlayState,
          countdown: undefined,
          command: prePlayId,
          audioEnabled: true,
          delay: prePlayDelay,
        };

        sequence.splice(insertIndex, 0, prePlayStep);
        logger.log(`Inserted ${prePlayId} (${prePlayDelay}ms) achieving ${achievedLead}ms lead before ${commandStepId}`);
      };

      insertPrePlayStep('prepare_warning_5', 'preplay_ready_command', 'prepare', readyCommandOffset);
      insertPrePlayStep('fire_start', 'preplay_fire_command', 'prepare_warning', fireCommandOffset);
      insertPrePlayStep('fire_warning_2', 'preplay_cease_command', 'fire', ceaseCommandOffset);

      return sequence;
    };

    const handleTimerEvent = async (event: TimerEvent, helpers: TimerEventHelpers) => {
      if (event.type === 'state_change') {
        // Handle command display based on event.command (like main branch does)
        const isPrePlayCommand = event.command?.startsWith('preplay_');
        if (event.command && event.command !== 'beep' && event.command !== 'continuous_beep' && !isPrePlayCommand) {
          let translatedCommand = '';
          try {
            translatedCommand = t(`field.commands.${event.command}`);
          } catch (e) {
            translatedCommand = String(event.command);
          }
          helpers.setCurrentCommand(translatedCommand);
        } else if (!event.command || event.command === 'beep' || event.command === 'continuous_beep' || isPrePlayCommand) {
          // Clear command text if no command or beep/pre-play command
          helpers.clearCurrentCommand();
        }
        return true;
      }

      if (event.type === 'countdown') {
        // Handle countdown-based command display (like main branch)
        const newCountdown = event.countdown ?? null;
        if (newCountdown === null) {
          return false;
        }
        const state = event.state || helpers.getCurrentState();

        // PREPARE phase (white, countdown > 5): no text
        if (state === 'prepare' && newCountdown > 5) {
          helpers.setCurrentCommand('');
        }
        // PREPARE_WARNING phase start (yellow, at 5): show "KLAR"
        else if (state === 'prepare_warning' && newCountdown === 5) {
          helpers.setCurrentCommand(t('field.commands.ready_command'));
        }
        // PREPARE_WARNING phase (yellow, countdown < 5): no text
        else if (state === 'prepare_warning' && newCountdown < 5) {
          helpers.setCurrentCommand('');
        }
        // FIRE phase start (green, at shootingDuration): show "ILD!"
        else if (state === 'fire' && newCountdown === shootingDuration) {
          helpers.setCurrentCommand(t('field.commands.fire_command'));
        }
        // FIRE phase (green, countdown < shootingDuration): no text
        else if (state === 'fire' && newCountdown < shootingDuration && newCountdown > 2) {
          helpers.setCurrentCommand('');
        }
        // FIRE_WARNING phase (yellow): show "STAANS"
        else if (state === 'fire_warning') {
          helpers.setCurrentCommand(t('field.commands.cease_command'));
        }
        // FINISHED phase (red, 0): no text
        else if (state === 'finished' && newCountdown === 0) {
          helpers.setCurrentCommand('');
        }
        return false;
      }

      if (event.type !== 'command' || !event.command) {
        return false;
      }

      if (event.command === 'preplay_ready_command') {
        logger.log('🎵 PRE-PLAY ready_command - starting audio early');
        await CustomAudio.playIfEnabled(programId, 'ready_command');
        return true;
      }

      if (event.command === 'preplay_fire_command') {
        logger.log('🎵 PRE-PLAY fire_command - starting audio early');
        await CustomAudio.playIfEnabled(programId, 'fire_command');
        return true;
      }

      if (event.command === 'preplay_cease_command') {
        logger.log('🎵 PRE-PLAY cease_command - starting audio early');
        await CustomAudio.playIfEnabled(programId, 'cease_command');
        return true;
      }

      if (event.command === 'beep') {
        const eventState = event.state || helpers.getCurrentState();
        const stepId = event.stepId || '';
        let customDuration = 0;

        if (eventState === 'prepare_warning' && stepId === 'prepare_warning_5') {
          const readyCommandOffset = await CustomAudio.getOffset(programId, 'ready_command');
          if (readyCommandOffset >= 0) {
            customDuration = await CustomAudio.playIfEnabled(programId, 'ready_command');
            logger.log(`✅ Custom audio for ready_command: duration=${customDuration}ms`);
          } else {
            logger.log(`✅ Audio for ready_command already playing (started ${-readyCommandOffset}ms ago)`);
            customDuration = 1;
          }
        } else if (eventState === 'fire' && stepId === 'fire_start') {
          const fireCommandOffset = await CustomAudio.getOffset(programId, 'fire_command');
          if (fireCommandOffset >= 0) {
            customDuration = await CustomAudio.playIfEnabled(programId, 'fire_command');
            logger.log(`✅ Custom audio for fire_command: duration=${customDuration}ms`);
          } else {
            logger.log(`✅ Audio for fire_command already playing (started ${-fireCommandOffset}ms ago)`);
            customDuration = 1;
          }
        } else {
          logger.log('❌ No custom audio condition matched');
        }

        if (customDuration === 0) {
          AudioService.playBeep(false);
        }
        return true;
      }

      if (event.command === 'continuous_beep') {
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
        return true;
      }

      if (event.command === 'shooters_ready') {
        helpers.setCurrentCommand(t('field.commands.shooters_ready'));
        const duration = await CustomAudio.playIfEnabled(programId, 'shooters_ready');
        logger.log(`Custom audio playing for shooters_ready: duration=${duration}ms`);
        if (duration === 0) {
          const translatedCommand = t('field.commands.shooters_ready');
          try {
            AudioService.speak(translatedCommand);
          } catch (error) {
            logger.error('AudioService.speak failed', error);
          }
        }
        return true;
      }

      return false;
    };

    const getDisplayColor = (context: TimerDisplayContext) => {
      if (context.currentState === 'prepare') return '#FFFFFF';
      if (context.currentState === 'prepare_warning') return '#FFC107';
      if (context.currentState === 'fire') return '#4CAF50';
      if (context.currentState === 'fire_warning') return '#FFC107';
      if (context.currentState === 'finished') return '#F44336';
      return context.backgroundColor;
    };

    const showFullscreenDisplay = (context: TimerDisplayContext) => context.isRunning;

    const bindings: TimerProgramBindings = {
      settings: settingsBindings,
      beforeTimerStart,
      adjustSequence,
      handleTimerEvent,
      showFullscreenDisplay,
      getDisplayColor: (context) => getDisplayColor(context),
    };

    return bindings;
  },
};

export default standardFieldTimerAdapter;
