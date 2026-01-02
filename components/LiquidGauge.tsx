import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, borderRadius, typography } from '../theme';

interface LiquidGaugeProps {
  percentage: number;
  color: string;
  size?: number;
}

const LiquidGauge: React.FC<LiquidGaugeProps> = ({ percentage, color, size = 100 }) => {
  const clampedPercentage = useMemo(() => Math.min(Math.max(percentage, 0), 100), [percentage]);
  const height = size * 1.3;

  return (
    <View style={[styles.container, { width: size, height }]}>
      {/* Glass Reflection */}
      <View style={styles.glassReflection} />
      
      {/* Liquid */}
      <View style={styles.liquidContainer}>
        <MotiView
          from={{ height: 0 }}
          animate={{ height: `${clampedPercentage}%` }}
          transition={{ type: 'timing', duration: 1500 }}
          style={[styles.liquid, { backgroundColor: color }]}
        >
          {/* Wave effect approximation */}
          <View style={[styles.wave, { backgroundColor: `${color}CC` }]} />
        </MotiView>
      </View>
      
      {/* Percentage Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.percentageText}>{Math.round(clampedPercentage)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface300,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(36, 36, 36, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  glassReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  liquidContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  liquid: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  percentageText: {
    fontSize: typography.fontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LiquidGauge;
