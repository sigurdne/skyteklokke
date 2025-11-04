export type RootStackParamList = {
  Home: undefined;
  Timer: { programId: string };
  Settings: undefined;
  About: undefined;
  PPC: { selectedDiscipline?: string } | undefined;
};
