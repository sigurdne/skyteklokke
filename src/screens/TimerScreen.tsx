import React from 'react';

import { BaseTimerScreen, TimerProgramAdapter, TimerScreenProps } from './timer/BaseTimerScreen';
import { defaultTimerAdapter } from './timer/adapters/DefaultTimerAdapter';
import { standardDuelTimerAdapter } from './timer/adapters/StandardDuelTimerAdapter';
import { standardFieldTimerAdapter } from './timer/adapters/StandardFieldTimerAdapter';
import { ppcTimerAdapter } from './timer/adapters/PpcTimerAdapter';

const adapterRegistry: Record<string, TimerProgramAdapter> = {
  'standard-field': standardFieldTimerAdapter,
  'standard-duel': standardDuelTimerAdapter,
  'ppc-standard': ppcTimerAdapter,
};

export const TimerScreen: React.FC<TimerScreenProps> = (props) => {
  const { route } = props;
  const programId = route.params.programId;
  const adapter = adapterRegistry[programId] ?? defaultTimerAdapter;

  return <BaseTimerScreen {...props} adapter={adapter} />;
};

export default TimerScreen;
