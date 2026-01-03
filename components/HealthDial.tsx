import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MotiView } from 'moti';
import { colors, spacing, typography } from '../theme';

const SCORE_THRESHOLDS = {
  LOW: 40,
  MEDIUM: 60,
} as const;

const SCORE_COLORS = {
  LOW: colors.danger,
  MEDIUM: colors.warning,
  HIGH: colors.mint,
} as const;

const SCORE_LABELS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
} as const;

interface HealthDialProps {
  score: number;
}

const HealthDial: React.FC<HealthDialProps> = React.memo(({ score }) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = radius * Math.PI;

  const color = useMemo(() => {
    if (normalizedScore < SCORE_THRESHOLDS.LOW) return SCORE_COLORS.LOW;
    if (normalizedScore < SCORE_THRESHOLDS.MEDIUM) return SCORE_COLORS.MEDIUM;
    return SCORE_COLORS.HIGH;
  }, [normalizedScore]);

  const label = useMemo(() => {
    if (normalizedScore > 75) return SCORE_LABELS.EXCELLENT;
    if (normalizedScore > 50) return SCORE_LABELS.GOOD;
    return SCORE_LABELS.FAIR;
  }, [normalizedScore]);

  const progress = useMemo(() => 
    (normalizedScore / 100) * circumference,
    [normalizedScore, circumference]
  );

  return (
    <View style={styles.container}>
      <Svg width={200} height={110} viewBox="0 0 200 110">
        {/* Background Arc */}
        <Path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={colors.surface300}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <Path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </Svg>
      
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: 'timing', duration: 500 }}
        style={styles.labelContainer}
      >
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={[styles.labelText, { color }]}>{label}</Text>
      </MotiView>
    </View>
  );
});

HealthDial.displayName = 'HealthDial';

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.light,
    color: colors.white,
  },
  labelText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
});

export default HealthDial;
