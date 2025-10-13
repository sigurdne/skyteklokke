import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../theme';
import { ProgramCardProps } from '../types';

export const ProgramCard: React.FC<ProgramCardProps> = ({
  icon,
  title,
  description,
  category,
  difficulty,
  onPress,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const getCategoryColor = () => {
    switch (category) {
      case 'field':
        return colors.success;
      case 'duel':
        return colors.warning;
      case 'silhouette':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor() }]} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        {difficulty && (
          <Text style={styles.difficulty}>
            {difficulty === 'beginner' && '●'}
            {difficulty === 'intermediate' && '●●'}
            {difficulty === 'expert' && '●●●'}
          </Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.startText}>{t('programs.start_program')} →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 40,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardContent: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  difficulty: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startText: {
    ...typography.button,
    color: colors.primary,
  },
});
