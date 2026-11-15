import { PPCDiscipline } from './ppcTypes';

export const PPC_ALLOWED_TIMES = [8, 12, 20, 35, 90, 165] as const;

export type PPCTimeSeconds = typeof PPC_ALLOWED_TIMES[number];

export type PPCPosition =
  | 'standing'
  | 'standing_one_hand'
  | 'kneeling'
  | 'sitting'
  | 'prone'
  | 'barricade_left'
  | 'barricade_right';

export interface PPCStageSeries {
  shots: number;
  position: PPCPosition;
  repetitions?: number;
  notesKey?: string;
}

export interface PPCStageVariant {
  id: string;
  shots: number;
  descriptionKey: string;
}

export interface PPCStage {
  id: string;
  match: string;
  stage?: string;
  distanceYards: number;
  series: PPCStageSeries[];
  timeSeconds: PPCTimeSeconds;
  titleKey: string;
  briefingKey: string;
  audioTitleKey?: string;
  audioBriefingKey?: string;
  variants?: PPCStageVariant[];
}

export interface PPCDisciplineStageEntry {
  stageId: string;
  titleKey: string;
  descriptionKey?: string;
}

export interface PPCDisciplineGroup {
  id: string;
  titleKey: string;
  stages: PPCDisciplineStageEntry[];
}

export interface PPCDisciplineDefinition {
  id: PPCDiscipline;
  titleKey: string;
  descriptionKey: string;
  groups: PPCDisciplineGroup[];
}

export const PPC_STAGE_DEFINITIONS: Record<string, PPCStage> = {
  'wa1500_stage_7y_standing_20s': {
    id: 'wa1500_stage_7y_standing_20s',
    match: 'wa1500_short_range',
    stage: 'stage_7y',
    distanceYards: 7,
    series: [{ shots: 6, position: 'standing', repetitions: 2 }],
    timeSeconds: 20,
    titleKey: 'ppc.stage.title.wa1500_stage_7y_standing_20s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_7y_standing_20s',
  },
  'wa1500_stage_15y_standing_20s': {
    id: 'wa1500_stage_15y_standing_20s',
    match: 'wa1500_match1',
    stage: 'stage_15y',
    distanceYards: 15,
    series: [{ shots: 6, position: 'standing', repetitions: 2 }],
    timeSeconds: 20,
    titleKey: 'ppc.stage.title.wa1500_stage_15y_standing_20s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_15y_standing_20s',
  },
  'wa1500_stage_25y_barricade_90s': {
    id: 'wa1500_stage_25y_barricade_90s',
    match: 'wa1500_match2',
    stage: 'stage_barricade',
    distanceYards: 25,
    series: [
      { shots: 6, position: 'kneeling' },
      { shots: 6, position: 'barricade_left' },
      { shots: 6, position: 'barricade_right' },
    ],
    timeSeconds: 90,
    titleKey: 'ppc.stage.title.wa1500_stage_25y_barricade_90s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_25y_barricade_90s',
  },
  'wa1500_stage_50y_full_165s': {
    id: 'wa1500_stage_50y_full_165s',
    match: 'wa1500_match3',
    stage: 'stage_longrange_full',
    distanceYards: 50,
    series: [
      { shots: 6, position: 'sitting' },
      { shots: 6, position: 'prone' },
      { shots: 6, position: 'barricade_left' },
      { shots: 6, position: 'barricade_right' },
    ],
    timeSeconds: 165,
    titleKey: 'ppc.stage.title.wa1500_stage_50y_full_165s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_50y_full_165s',
  },
  'wa1500_stage_25y_double_standing_35s': {
    id: 'wa1500_stage_25y_double_standing_35s',
    match: 'wa1500_match4',
    stage: 'stage_double_standing',
    distanceYards: 25,
    series: [{ shots: 6, position: 'standing', repetitions: 2 }],
    timeSeconds: 35,
    titleKey: 'ppc.stage.title.wa1500_stage_25y_double_standing_35s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_25y_double_standing_35s',
  },
  'wa1500_stage_50y_sit_prone_165s': {
    id: 'wa1500_stage_50y_sit_prone_165s',
    match: 'wa1500_match5',
    stage: 'stage_sit_prone',
    distanceYards: 50,
    series: [
      { shots: 6, position: 'sitting', repetitions: 2 },
      { shots: 6, position: 'prone', repetitions: 2 },
    ],
    timeSeconds: 165,
    titleKey: 'ppc.stage.title.wa1500_stage_50y_sit_prone_165s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_50y_sit_prone_165s',
  },
  'wa1500_stage_25y_fast_12s': {
    id: 'wa1500_stage_25y_fast_12s',
    match: 'wa1500_match5',
    stage: 'stage_fast',
    distanceYards: 25,
    series: [{ shots: 6, position: 'standing' }],
    timeSeconds: 12,
    titleKey: 'ppc.stage.title.wa1500_stage_25y_fast_12s',
    briefingKey: 'ppc.stage.briefing.wa1500_stage_25y_fast_12s',
  },
  'ppc48_stage_3y_onehand_8s': {
    id: 'ppc48_stage_3y_onehand_8s',
    match: 'ppc48_match1',
    stage: 'stage_close',
    distanceYards: 3,
    series: [{ shots: 6, position: 'standing_one_hand' }],
    timeSeconds: 8,
    titleKey: 'ppc.stage.title.ppc48_stage_3y_onehand_8s',
    briefingKey: 'ppc.stage.briefing.ppc48_stage_3y_onehand_8s',
    variants: [
      {
        id: 'ppc48_stage_3y_onehand_8s_variant_40',
        shots: 5,
        descriptionKey: 'ppc.stage.variant.ppc48_stage_3y_onehand_8s.40shot',
      },
    ],
  },
  'ppc48_stage_7y_standing_20s': {
    id: 'ppc48_stage_7y_standing_20s',
    match: 'ppc48_match2',
    stage: 'stage_midrange',
    distanceYards: 7,
    series: [{ shots: 12, position: 'standing' }],
    timeSeconds: 20,
    titleKey: 'ppc.stage.title.ppc48_stage_7y_standing_20s',
    briefingKey: 'ppc.stage.briefing.ppc48_stage_7y_standing_20s',
    variants: [
      {
        id: 'ppc48_stage_7y_standing_20s_variant_40',
        shots: 10,
        descriptionKey: 'ppc.stage.variant.ppc48_stage_7y_standing_20s.40shot',
      },
    ],
  },
  'ppc48_stage_15y_standing_20s': {
    id: 'ppc48_stage_15y_standing_20s',
    match: 'ppc48_match3',
    stage: 'stage_midrange_long',
    distanceYards: 15,
    series: [{ shots: 12, position: 'standing' }],
    timeSeconds: 20,
    titleKey: 'ppc.stage.title.ppc48_stage_15y_standing_20s',
    briefingKey: 'ppc.stage.briefing.ppc48_stage_15y_standing_20s',
    variants: [
      {
        id: 'ppc48_stage_15y_standing_20s_variant_40',
        shots: 10,
        descriptionKey: 'ppc.stage.variant.ppc48_stage_15y_standing_20s.40shot',
      },
    ],
  },
  'ppc48_stage_25y_barricade_90s': {
    id: 'ppc48_stage_25y_barricade_90s',
    match: 'ppc48_match4',
    stage: 'stage_barricade',
    distanceYards: 25,
    series: [
      { shots: 6, position: 'kneeling' },
      { shots: 6, position: 'barricade_left' },
      { shots: 6, position: 'barricade_right' },
    ],
    timeSeconds: 90,
    titleKey: 'ppc.stage.title.ppc48_stage_25y_barricade_90s',
    briefingKey: 'ppc.stage.briefing.ppc48_stage_25y_barricade_90s',
    variants: [
      {
        id: 'ppc48_stage_25y_barricade_90s_variant_40',
        shots: 15,
        descriptionKey: 'ppc.stage.variant.ppc48_stage_25y_barricade_90s.40shot',
      },
    ],
  },
};

export const PPC_DISCIPLINE_DEFINITIONS: Record<PPCDiscipline, PPCDisciplineDefinition> = {
  'wa1500-150': {
    id: 'wa1500-150',
    titleKey: 'ppc.discipline.title.wa1500_150',
    descriptionKey: 'ppc.discipline.description.wa1500_150',
    groups: [
      {
        id: 'match1',
        titleKey: 'ppc.discipline.wa1500_150.match1.title',
        stages: [
          {
            stageId: 'wa1500_stage_7y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_150.match1.stage1.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match1.stage1.description',
          },
          {
            stageId: 'wa1500_stage_15y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_150.match1.stage2.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match1.stage2.description',
          },
        ],
      },
      {
        id: 'match2',
        titleKey: 'ppc.discipline.wa1500_150.match2.title',
        stages: [
          {
            stageId: 'wa1500_stage_25y_barricade_90s',
            titleKey: 'ppc.discipline.wa1500_150.match2.stage1.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match2.stage1.description',
          },
        ],
      },
      {
        id: 'match3',
        titleKey: 'ppc.discipline.wa1500_150.match3.title',
        stages: [
          {
            stageId: 'wa1500_stage_50y_full_165s',
            titleKey: 'ppc.discipline.wa1500_150.match3.stage1.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match3.stage1.description',
          },
        ],
      },
      {
        id: 'match4',
        titleKey: 'ppc.discipline.wa1500_150.match4.title',
        stages: [
          {
            stageId: 'wa1500_stage_25y_double_standing_35s',
            titleKey: 'ppc.discipline.wa1500_150.match4.stage1.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match4.stage1.description',
          },
        ],
      },
      {
        id: 'match5',
        titleKey: 'ppc.discipline.wa1500_150.match5.title',
        stages: [
          {
            stageId: 'wa1500_stage_7y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_150.match5.stage1.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match5.stage1.description',
          },
          {
            stageId: 'wa1500_stage_25y_barricade_90s',
            titleKey: 'ppc.discipline.wa1500_150.match5.stage2.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match5.stage2.description',
          },
          {
            stageId: 'wa1500_stage_50y_sit_prone_165s',
            titleKey: 'ppc.discipline.wa1500_150.match5.stage3.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match5.stage3.description',
          },
          {
            stageId: 'wa1500_stage_25y_fast_12s',
            titleKey: 'ppc.discipline.wa1500_150.match5.stage4.title',
            descriptionKey: 'ppc.discipline.wa1500_150.match5.stage4.description',
          },
        ],
      },
    ],
  },
  'wa1500-60': {
    id: 'wa1500-60',
    titleKey: 'ppc.discipline.title.wa1500_60',
    descriptionKey: 'ppc.discipline.description.wa1500_60',
    groups: [
      {
        id: 'stage1',
        titleKey: 'ppc.discipline.wa1500_60.stage1.title',
        stages: [
          {
            stageId: 'wa1500_stage_7y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_60.stage1.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_60.stage1.stage.description',
          },
        ],
      },
      {
        id: 'stage2',
        titleKey: 'ppc.discipline.wa1500_60.stage2.title',
        stages: [
          {
            stageId: 'wa1500_stage_25y_barricade_90s',
            titleKey: 'ppc.discipline.wa1500_60.stage2.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_60.stage2.stage.description',
          },
        ],
      },
      {
        id: 'stage3',
        titleKey: 'ppc.discipline.wa1500_60.stage3.title',
        stages: [
          {
            stageId: 'wa1500_stage_50y_full_165s',
            titleKey: 'ppc.discipline.wa1500_60.stage3.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_60.stage3.stage.description',
          },
        ],
      },
      {
        id: 'stage4',
        titleKey: 'ppc.discipline.wa1500_60.stage4.title',
        stages: [
          {
            stageId: 'wa1500_stage_25y_fast_12s',
            titleKey: 'ppc.discipline.wa1500_60.stage4.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_60.stage4.stage.description',
          },
        ],
      },
    ],
  },
  'wa1500-48': {
    id: 'wa1500-48',
    titleKey: 'ppc.discipline.title.wa1500_48',
    descriptionKey: 'ppc.discipline.description.wa1500_48',
    groups: [
      {
        id: 'stage1',
        titleKey: 'ppc.discipline.wa1500_48.stage1.title',
        stages: [
          {
            stageId: 'ppc48_stage_3y_onehand_8s',
            titleKey: 'ppc.discipline.wa1500_48.stage1.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_48.stage1.stage.description',
          },
        ],
      },
      {
        id: 'stage2',
        titleKey: 'ppc.discipline.wa1500_48.stage2.title',
        stages: [
          {
            stageId: 'ppc48_stage_7y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_48.stage2.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_48.stage2.stage.description',
          },
        ],
      },
      {
        id: 'stage3',
        titleKey: 'ppc.discipline.wa1500_48.stage3.title',
        stages: [
          {
            stageId: 'ppc48_stage_15y_standing_20s',
            titleKey: 'ppc.discipline.wa1500_48.stage3.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_48.stage3.stage.description',
          },
        ],
      },
      {
        id: 'stage4',
        titleKey: 'ppc.discipline.wa1500_48.stage4.title',
        stages: [
          {
            stageId: 'ppc48_stage_25y_barricade_90s',
            titleKey: 'ppc.discipline.wa1500_48.stage4.stage.title',
            descriptionKey: 'ppc.discipline.wa1500_48.stage4.stage.description',
          },
        ],
      },
    ],
  },
};

export const PPC_STAGE_IDS = Object.keys(PPC_STAGE_DEFINITIONS);

export function getStageDefinition(stageId: string): PPCStage | undefined {
  return PPC_STAGE_DEFINITIONS[stageId];
}

export function getDisciplineDefinition(id: PPCDiscipline): PPCDisciplineDefinition {
  return PPC_DISCIPLINE_DEFINITIONS[id];
}
