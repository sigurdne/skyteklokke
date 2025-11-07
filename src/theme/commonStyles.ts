/**
 * Common Style Patterns
 * 
 * Shared style objects used across multiple components to maintain consistency
 * and reduce duplication. Import and spread these into component-specific StyleSheets.
 * 
 * USAGE:
 * ```typescript
 * import { screenStyles, cardStyles } from '../theme/commonStyles';
 * 
 * const styles = StyleSheet.create({
 *   ...screenStyles,
 *   ...cardStyles,
 *   // Component-specific styles
 *   customStyle: { ... }
 * });
 * ```
 */

import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

/**
 * Standard screen layout patterns
 * Used by: HomeScreen, SettingsScreen, AboutScreen, PpcHomeScreen
 */
export const screenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
});

/**
 * Card component patterns
 * Used by: ProgramCard, PpcHomeScreen (stageCard, card), HomeScreen modals
 */
export const cardStyles = StyleSheet.create({
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
  cardWithBorder: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
});

/**
 * Section header patterns
 * Used by: SettingsScreen, AboutScreen, PpcHomeScreen
 */
export const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionAction: {
    ...typography.button,
    color: colors.primary,
  },
});

/**
 * List and list item patterns
 * Used by: SettingsScreen, PpcHomeScreen
 */
export const listStyles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  listItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  listItemText: {
    ...typography.body,
    color: colors.text,
  },
  listItemTextSelected: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

/**
 * Modal overlay patterns
 * Used by: HomeScreen
 */
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Below header
    paddingRight: spacing.lg,
  },
  menuContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

/**
 * Text patterns
 * Used by: Multiple components
 */
export const textStyles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryText: {
    ...typography.body,
    color: colors.primary,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
  },
});
