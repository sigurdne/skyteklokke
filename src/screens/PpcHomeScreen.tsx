import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Audio } from 'expo-av';
import { playUri, type PlayHandle } from '../utils/audioHelpers';

import { Header } from '../components/Header';
import ProgramManager from '../services/ProgramManager';
import AudioService from '../services/AudioService';
import logger from '../utils/logger';
import {
  AudioClipMeta,
  deleteClip,
  loadClipMeta,
  moveRecordingToLibrary,
} from '../services/AudioClipService';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { PPCProgram, PPCProgramSettings } from '../programs/ppc/PPCProgram';
import type { PPCDiscipline } from '../programs/ppc/ppcTypes';
import type {
  PPCDisciplineDefinition,
  PPCDisciplineGroup,
  PPCDisciplineStageEntry,
  PPCStage,
  PPCPosition,
} from '../programs/ppc/stages';
import { Language } from '../types';

const SUPPORTED_LANGUAGES: Language[] = ['no', 'en', 'sv', 'da'];

const normalizeLanguage = (value: string | undefined): Language => {
  if (!value) {
    return 'no';
  }

  const code = value.split('-')[0];
  if (code === 'nb') {
    return 'no';
  }

  return SUPPORTED_LANGUAGES.includes(code as Language) ? (code as Language) : 'no';
};

interface StageDetailState {
  disciplineId: PPCDiscipline;
  entry: PPCDisciplineStageEntry;
  stage: PPCStage;
}

type PpcHomeScreenProps = NativeStackScreenProps<RootStackParamList, 'PPC'>;

export const PpcHomeScreen: React.FC<PpcHomeScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const language = useMemo(() => normalizeLanguage(i18n.language), [i18n.language]);

  useEffect(() => {
    AudioService.setLanguage(language);
  }, [language]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<PPCDiscipline | null>(
    (route.params?.selectedDiscipline as PPCDiscipline) || null
  );
  const [stageDetail, setStageDetail] = useState<StageDetailState | null>(null);

  const program = useMemo(() => ProgramManager.getProgram('ppc-standard') as PPCProgram | undefined, []);

  // Update selectedDiscipline when route params change
  useEffect(() => {
    if (route.params?.selectedDiscipline) {
      setSelectedDiscipline(route.params.selectedDiscipline as PPCDiscipline);
    }
  }, [route.params?.selectedDiscipline]);

  // Close modal when screen is focused (e.g., when returning from timer)
  useFocusEffect(
    useCallback(() => {
      setStageDetail(null);
    }, [])
  );

  if (!program) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t('navigation.home_title')} onBackPress={() => navigation.goBack()} />
        <View style={[styles.container, styles.centered]}>
          <Text style={typography.body}>{t('ppc.home.program_missing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const disciplineDefinitions = program.listDisciplineDefinitions();

  const handleDisciplineSelect = (discipline: PPCDiscipline) => {
    setSelectedDiscipline(discipline);
  };

  const handleStageSelect = useCallback(
    (disciplineId: PPCDiscipline, entry: PPCDisciplineStageEntry) => {
      if (!program) {
        return;
      }
      const stage = program.getStageDefinition(entry.stageId);
      if (!stage) {
        return;
      }
      setStageDetail({ disciplineId, entry, stage });
    },
    [program],
  );

  const handleStageStart = useCallback(
    (disciplineId: PPCDiscipline, stageId: string) => {
      if (!program) {
        return;
      }

      const settingsUpdate: Partial<PPCProgramSettings> = {
        discipline: disciplineId,
        currentStageId: stageId,
      };

      try {
        program.updateSettings(settingsUpdate);
      } catch (error) {
        logger.warn('Failed to update PPC program settings', error);
      }

      ProgramManager.setActiveProgram('ppc-standard');
      navigation.navigate('Timer', { programId: 'ppc-standard' });
      setStageDetail(null);
    },
    [navigation, program],
  );

  const renderDisciplineList = () => (
    <ScrollView contentContainerStyle={styles.listContent}>
      {disciplineDefinitions.map((discipline) => (
        <TouchableOpacity
          key={discipline.id}
          style={styles.card}
          onPress={() => handleDisciplineSelect(discipline.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.cardTitle}>{disciplineTitle(discipline, t)}</Text>
          <Text style={styles.cardDescription}>{disciplineDescription(discipline, t)}</Text>
          <Text style={styles.cardMeta}>{t('ppc.home.stage_count', { count: countStages(discipline) })}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStageList = (disciplineId: PPCDiscipline) => {
    const definition = disciplineDefinitions.find((d) => d.id === disciplineId);
    if (!definition) {
      return null;
    }

    if (!program) {
      return null;
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {definition.groups.map((group) => (
          <View key={group.id} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{groupTitle(group, t)}</Text>
            {group.stages.map((entry) => {
              const stage = program.getStageDefinition(entry.stageId);
              if (!stage) {
                return null;
              }
              return (
                <TouchableOpacity
                  key={`${group.id}-${entry.stageId}-${entry.titleKey}`}
                  style={styles.stageCard}
                  onPress={() => handleStageStart(disciplineId, entry.stageId)}
                  activeOpacity={0.75}
                >
                  <View style={styles.stageHeader}>
                    <Text style={styles.stageTitle}>{stageTitle(stage, entry.titleKey, t)}</Text>
                    <View style={styles.stageHeaderRight}>
                      <Text style={styles.stageTime}>{formatStageTime(stage.timeSeconds, t)}</Text>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleStageSelect(disciplineId, entry);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.stageSubtitle}>{stageSubtitle(stage, entry.descriptionKey, t)}</Text>
                  <View style={styles.seriesList}>
                    {stage.series.map((series, index) => (
                      <Text key={`${stage.id}-series-${index}`} style={styles.seriesItem}>
                        {formatSeries(series, t)}
                      </Text>
                    ))}
                  </View>
                  {stage.variants && stage.variants.length > 0 && (
                    <View style={styles.variantBox}>
                      {stage.variants.map((variant) => (
                        <Text key={variant.id} style={styles.variantText}>
                          {variantText(variant.descriptionKey, variant.shots, t)}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t('programs.ppc_title')}
        subtitle={t('ppc.home.subtitle')}
        onBackPress={() => {
          if (selectedDiscipline) {
            setSelectedDiscipline(null);
          } else {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }
        }}
      />
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDiscipline ? t('ppc.home.select_stage') : t('ppc.home.select_discipline')}
          </Text>
          {selectedDiscipline && (
            <TouchableOpacity onPress={() => setSelectedDiscipline(null)}>
              <Text style={styles.sectionAction}>{t('ppc.home.back_to_disciplines')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {selectedDiscipline ? renderStageList(selectedDiscipline) : renderDisciplineList()}
      </View>
      <StageDetailModal
        visible={Boolean(stageDetail)}
        detail={stageDetail}
        onClose={() => setStageDetail(null)}
        onStartStage={handleStageStart}
        t={t}
        language={language}
      />
    </SafeAreaView>
  );
};

const POSITION_FALLBACK: Record<PPCPosition, string> = {
  standing: 'Standing',
  standing_one_hand: 'Standing (one hand)',
  kneeling: 'Kneeling',
  sitting: 'Sitting',
  prone: 'Prone',
  barricade_left: 'Barricade left',
  barricade_right: 'Barricade right',
};

interface StageDetailModalProps {
  visible: boolean;
  detail: StageDetailState | null;
  onClose: () => void;
  onStartStage: (disciplineId: PPCDiscipline, stageId: string) => void;
  t: TFunction;
  language: Language;
}

interface AudioControlRowProps {
  label: string;
  clipKey: string;
  visible: boolean;
  t: TFunction;
  onClipChange?: (clip: AudioClipMeta | null) => void;
  previewText?: string;
  language: Language;
}

const StageDetailModal: React.FC<StageDetailModalProps> = ({ visible, detail, onClose, onStartStage, t, language }) => {
  const [recordingsExpanded, setRecordingsExpanded] = useState(false);
  const [titleClip, setTitleClip] = useState<AudioClipMeta | null>(null);
  const [briefingClip, setBriefingClip] = useState<AudioClipMeta | null>(null);
  const [playingKey, setPlayingKey] = useState<'title' | 'briefing' | null>(null);
  const stageSoundRef = useRef<PlayHandle | null>(null);

  useEffect(() => {
    if (!visible) {
      AudioService.stop().catch(() => undefined);
      if (stageSoundRef.current) {
        stageSoundRef.current.stop().catch(() => undefined);
        stageSoundRef.current = null;
      }
      setPlayingKey(null);
      setRecordingsExpanded(false);
      setTitleClip(null);
      setBriefingClip(null);
    }
  }, [visible]);

  const stageId = detail?.stage.id ?? null;
  const titleClipKey = stageId ? `ppc_stage_${stageId}_title` : null;
  const briefingClipKey = stageId ? `ppc_stage_${stageId}_briefing` : null;

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (!titleClipKey || !briefingClipKey) {
      setTitleClip(null);
      setBriefingClip(null);
      return;
    }

    let cancelled = false;
    setTitleClip(null);
    setBriefingClip(null);

    (async () => {
      try {
        const [titleMeta, briefingMeta] = await Promise.all([
          loadClipMeta(titleClipKey, language),
          loadClipMeta(briefingClipKey, language),
        ]);

        if (!cancelled) {
          setTitleClip(titleMeta);
          setBriefingClip(briefingMeta);
        }
      } catch (error) {
        logger.warn('Failed to load stage recordings', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, visible, titleClipKey, briefingClipKey]);

  const stage = detail?.stage ?? null;
  const entry = detail?.entry ?? null;
  const disciplineId = detail?.disciplineId ?? null;

  const playStageClip = useCallback(
    async (clip: AudioClipMeta | null, key: 'title' | 'briefing') => {
      if (!clip?.uri) {
        return;
      }

      if (playingKey === key && stageSoundRef.current) {
        await stageSoundRef.current.stop().catch(() => undefined);
        stageSoundRef.current = null;
        setPlayingKey(null);
        return;
      }

      try {
        await AudioService.stop();
      } catch (error) {
        logger.warn('Failed to stop TTS before playing stage clip', error);
      }

      if (stageSoundRef.current) {
        await stageSoundRef.current.stop().catch(() => undefined);
        stageSoundRef.current = null;
      }

      try {
        const handle = await playUri({
          uri: clip.uri,
          onFinish: () => {
            setPlayingKey((current) => (current === key ? null : current));
            if (stageSoundRef.current === handle) {
              stageSoundRef.current = null;
            }
          },
          onError: () => {
            setPlayingKey((current) => (current === key ? null : current));
          },
        });
        if (handle) {
          stageSoundRef.current = handle;
          setPlayingKey(key);
        }
      } catch (error) {
        logger.warn('Failed to play stage clip', error);
        setPlayingKey((current) => (current === key ? null : current));
      }
    },
    [playingKey],
  );

  if (!detail || !stage || !entry || !disciplineId || !titleClipKey || !briefingClipKey) {
    return null;
  }

  const stageTitleText = t(stage.titleKey, { defaultValue: stage.titleKey });
  const stageSubtitleText = stageSubtitle(stage, entry.descriptionKey, t);
  const positionsList = stage.series
    .map((series) => positionLabel(series.position, t))
    .filter(Boolean)
    .join(', ');

  // Detailed briefing text with all series information
  const detailedBriefingText = [
    stageSubtitleText,
    ...stage.series.map((series) => formatSeries(series, t)),
  ].filter(Boolean).join('\n');

  const commandRows = [
    {
      key: 'ppc_command_lade_hylstre',
      label: t('ppc.detail.command_prepare_label'),
    },
    {
      key: 'ppc_command_er_linja_klar',
      label: t('ppc.detail.command_line_ready_query_label'),
    },
    {
      key: 'ppc_command_linja_er_klar',
      label: t('ppc.detail.command_line_ready_label'),
    },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{stageTitleText}</Text>
            <Text style={styles.modalSubtitle}>{stageSubtitleText}</Text>
          </View>

          <View style={styles.modalMetaSection}>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>{t('ppc.detail.distance_label')}</Text>
              <Text style={styles.modalMetaValue}>{yardsLabel(stage.distanceYards, t)}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>{t('ppc.detail.time_label')}</Text>
              <Text style={styles.modalMetaValue}>{formatStageTime(stage.timeSeconds, t)}</Text>
            </View>
            <View style={styles.modalMetaRowVertical}>
              <Text style={styles.modalMetaLabel}>{t('ppc.detail.positions_label')}</Text>
              <Text style={styles.modalMetaValueWrap}>{positionsList}</Text>
            </View>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.audioButton, (!titleClip || playingKey === 'title') && styles.audioButtonDisabled]}
              onPress={() => playStageClip(titleClip, 'title')}
              disabled={!titleClip || playingKey === 'title'}
            >
              <Text style={styles.audioButtonText}>{t('ppc.detail.stage_title_label')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.audioButton, (!briefingClip || playingKey === 'briefing') && styles.audioButtonDisabled]}
              onPress={() => playStageClip(briefingClip, 'briefing')}
              disabled={!briefingClip || playingKey === 'briefing'}
            >
              <Text style={styles.audioButtonText}>{t('ppc.detail.stage_briefing_label')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <TouchableOpacity
              style={styles.collapseHeader}
              onPress={() => setRecordingsExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityState={{ expanded: recordingsExpanded }}
            >
              <Text style={styles.modalSectionTitle}>{t('ppc.detail.section_recordings')}</Text>
              <Text style={styles.collapseIndicator}>{recordingsExpanded ? '−' : '+'}</Text>
            </TouchableOpacity>

            {recordingsExpanded && (
              <View style={styles.recordingsContainer}>
                <ScrollView
                  style={styles.recordingsScroll}
                  contentContainerStyle={styles.recordingsScrollContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalSubSectionTitle}>{t('ppc.detail.section_briefing')}</Text>
                  <AudioControlRow
                    label={t('ppc.detail.stage_title_label')}
                    clipKey={titleClipKey}
                    visible={visible}
                    t={t}
                    onClipChange={setTitleClip}
                    previewText={stageTitleText}
                    language={language}
                  />
                  <AudioControlRow
                    label={t('ppc.detail.stage_briefing_label')}
                    clipKey={briefingClipKey}
                    visible={visible}
                    t={t}
                    onClipChange={setBriefingClip}
                    previewText={detailedBriefingText}
                    language={language}
                  />

                  <Text style={[styles.modalSubSectionTitle, styles.recordingsCommandsHeading]}>
                    {t('ppc.detail.section_commands')}
                  </Text>
                  {commandRows.map((row) => (
                    <AudioControlRow
                      key={row.key}
                      label={row.label}
                      clipKey={row.key}
                      visible={visible}
                      t={t}
                      language={language}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={() => onStartStage(disciplineId, stage.id)}
            >
              <Text style={styles.modalPrimaryButtonText}>{t('ppc.detail.start_stage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>{t('ppc.detail.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AudioControlRow: React.FC<AudioControlRowProps> = ({ label, clipKey, visible, t, onClipChange, previewText, language }) => {
  const [clip, setClip] = useState<AudioClipMeta | null>(null);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<PlayHandle | null>(null);
  const hasClip = Boolean(clip?.uri);

  const refreshClip = useCallback(async () => {
    const stored = await loadClipMeta(clipKey, language);
    setClip(stored);
  }, [clipKey, language]);

  useEffect(() => {
    if (visible) {
      refreshClip();
    }
  }, [visible, refreshClip]);

  useEffect(() => {
    onClipChange?.(clip);
  }, [clip, onClipChange]);

  useEffect(() => {
    return () => {
      if (isRecording && recordingInstance) {
        recordingInstance.stopAndUnloadAsync().catch(() => undefined);
      }
      if (soundRef.current) {
        soundRef.current.stop().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, [isRecording, recordingInstance]);

  const handlePlay = useCallback(async () => {
    if (isRecording) {
      return;
    }

    try {
      await AudioService.stop();
    } catch (error) {
      logger.warn('Failed to stop running audio before playback', error);
    }

    if (clip?.uri) {
      try {
        if (soundRef.current) {
          await soundRef.current.stop().catch(() => undefined);
          soundRef.current = null;
        }
        const handle = await playUri({
          uri: clip.uri,
          onFinish: () => {
            setIsPlaying(false);
            if (soundRef.current === handle) {
              soundRef.current = null;
            }
          },
          onError: () => setIsPlaying(false),
        });
        if (handle) {
          soundRef.current = handle;
          setIsPlaying(true);
        }
      } catch (error) {
        logger.warn('Failed to play recorded clip', error);
        setIsPlaying(false);
      }
      return;
    }
  }, [clip, isRecording]);

  const stopRecording = useCallback(async () => {
    if (!recordingInstance) {
      return;
    }
    try {
      await recordingInstance.stopAndUnloadAsync();
    } catch (error) {
      logger.warn('Failed to stop recording', error);
    }

    try {
      const status = await recordingInstance.getStatusAsync();
      const durationMs = 'durationMillis' in status ? status.durationMillis : undefined;
      const uri = recordingInstance.getURI();
      if (uri) {
        const meta = await moveRecordingToLibrary(clipKey, uri, durationMs ?? undefined, language);
        setClip(meta);
      }
    } catch (error) {
      logger.warn('Failed to persist recorded audio clip', error);
    } finally {
      setRecordingInstance(null);
      setIsRecording(false);
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      } catch (error) {
        logger.warn('Failed to reset audio mode after recording', error);
      }
    }
  }, [clipKey, language, recordingInstance]);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecordingInstance(recording);
      setIsRecording(true);
    } catch (error) {
      logger.warn('Failed to start recording', error);
      setRecordingInstance(null);
      setIsRecording(false);
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      } catch (resetError) {
        logger.warn('Failed to reset audio mode after failed recording start', resetError);
      }
    }
  }, []);

  const handleRecordToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteClip(clipKey, language);
      setClip(null);
    } catch (error) {
      logger.warn('Failed to delete audio clip', error);
    }
  }, [clipKey, language]);

  return (
    <View style={styles.audioRow}>
      <View style={styles.audioRowText}>
        <Text style={styles.audioRowLabel}>{label}</Text>
        {previewText && (
          <Text style={styles.audioRowPreview}>{previewText}</Text>
        )}
        {clip ? (
          <Text style={styles.audioRowMeta}>
            {t('ppc.detail.recorded_on', { date: new Date(clip.createdAt).toLocaleDateString() })}
          </Text>
        ) : (
          !isRecording && (
            <Text style={styles.audioRowMeta}>{t('ppc.detail.no_recording')}</Text>
          )
        )}
        {isRecording && <Text style={styles.audioRowRecording}>{t('ppc.detail.recording')}</Text>}
      </View>
      <View style={styles.audioRowButtons}>
        <TouchableOpacity
          style={[styles.audioButton, (!hasClip || isRecording) && styles.audioButtonDisabled]}
          onPress={handlePlay}
          disabled={isRecording || !hasClip}
        >
          <Text style={styles.audioButtonText}>{t('ppc.detail.play_recorded')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.audioButton} onPress={handleRecordToggle}>
          <Text style={styles.audioButtonText}>
            {isRecording ? t('ppc.detail.stop') : t('ppc.detail.record')}
          </Text>
        </TouchableOpacity>
        {clip && !isRecording && (
          <TouchableOpacity style={styles.audioButton} onPress={handleDelete} disabled={isPlaying}>
            <Text style={styles.audioDangerText}>{t('ppc.detail.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

function disciplineTitle(definition: PPCDisciplineDefinition, t: TFunction): string {
  return t(definition.titleKey, { defaultValue: definition.titleKey });
}

function disciplineDescription(definition: PPCDisciplineDefinition, t: TFunction): string {
  return t(definition.descriptionKey, { defaultValue: definition.descriptionKey });
}

function countStages(definition: PPCDisciplineDefinition): number {
  // Count total stage entries across all groups (matches)
  return definition.groups.reduce((total, group) => total + group.stages.length, 0);
}

function groupTitle(group: PPCDisciplineGroup, t: TFunction): string {
  return t(group.titleKey, { defaultValue: group.titleKey });
}

function stageTitle(stage: PPCStage, titleKey: string, t: TFunction): string {
  const fallback = `${stage.distanceYards} ${yardsLabel(stage.distanceYards, t)} • ${formatStageTime(stage.timeSeconds, t)}`;
  return t(titleKey, { defaultValue: fallback });
}

function stageSubtitle(stage: PPCStage, descriptionKey: string | undefined, t: TFunction): string {
  if (descriptionKey) {
    return t(descriptionKey, { defaultValue: descriptionKey });
  }
  const positions = stage.series.map((series) => positionLabel(series.position, t));
  return positions.join(' • ');
}

function formatSeries(series: PPCStage['series'][number], t: TFunction): string {
  const repetitions = series.repetitions ?? 1;
  const prefix = repetitions > 1 ? `${repetitions}×` : '';
  const shotsLabel = shotsText(series.shots, t);
  const positionText = positionLabel(series.position, t);
  return `${prefix}${shotsLabel} – ${positionText}`;
}

function formatStageTime(seconds: number, t: TFunction): string {
  return t('ppc.labels.time_seconds', { count: seconds, defaultValue: `${seconds}s` });
}

function variantText(descriptionKey: string, shots: number, t: TFunction): string {
  const description = t(descriptionKey, { defaultValue: descriptionKey });
  return `${description} (${shotsText(shots, t)})`;
}

function shotsText(count: number, t: TFunction): string {
  return t('ppc.labels.shots', {
    count,
  });
}

function yardsLabel(distance: number, t: TFunction): string {
  return t('ppc.labels.yards', {
    count: distance,
    defaultValue: distance === 1 ? 'yard' : 'yards',
  });
}

function positionLabel(position: PPCPosition, t: TFunction): string {
  return t(`ppc.positions.${position}`, {
    defaultValue: POSITION_FALLBACK[position],
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  },
  audioToggleIcon: {
    fontSize: 24,
  },
  sectionAction: {
    ...typography.button,
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.primary,
  },
  groupContainer: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  stageTime: {
    ...typography.caption,
    color: colors.success,
  },
  editButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  editIcon: {
    fontSize: 18,
  },
  stageSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  seriesList: {
    marginBottom: spacing.sm,
  },
  seriesItem: {
    ...typography.caption,
    color: colors.text,
  },
  variantBox: {
    backgroundColor: 'rgba(44, 62, 80, 0.08)',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  variantText: {
    ...typography.caption,
    color: colors.primary,
  },
  startHint: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalMetaSection: {
    marginBottom: spacing.lg,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalMetaRowVertical: {
    flexDirection: 'column',
    marginBottom: spacing.xs,
  },
  modalMetaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalMetaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  modalMetaValueWrap: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  collapseIndicator: {
    ...typography.h2,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  modalSubSectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginLeft: spacing.sm,
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.button,
    color: colors.text,
  },
  modalPrimaryButtonText: {
    ...typography.button,
    color: colors.background,
  },
  audioRow: {
    marginBottom: spacing.md,
  },
  audioRowText: {
    marginBottom: spacing.xs,
  },
  audioRowLabel: {
    ...typography.body,
    color: colors.text,
  },
  audioRowPreview: {
    ...typography.caption,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  audioRowMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  audioRowRecording: {
    ...typography.caption,
    color: colors.warning,
  },
  audioRowButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  audioButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  audioButtonDisabled: {
    opacity: 0.4,
  },
  audioButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  audioDangerText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
  },
  recordingsContainer: {
    maxHeight: 260,
  },
  recordingsScroll: {
    borderRadius: 8,
  },
  recordingsScrollContent: {
    paddingBottom: spacing.sm,
  },
  recordingsCommandsHeading: {
    marginTop: spacing.md,
  },
});
