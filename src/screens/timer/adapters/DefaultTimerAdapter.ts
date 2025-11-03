import { TimerProgramAdapter } from '../BaseTimerScreen';

export const defaultTimerAdapter: TimerProgramAdapter = {
  id: 'default',
  useBindings: () => ({})
};

export default defaultTimerAdapter;
