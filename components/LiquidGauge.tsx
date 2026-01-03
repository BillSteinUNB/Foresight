import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, borderRadius, typography } from '../theme';

interface ConfettiParticle {
  id: number;
  color: string;
  startX: number;
  delay: number;
  size: number;
}

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = ['#00D9A5', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const ConfettiParticle: React.FC<{ particle: ConfettiParticle; size: number }> = ({ particle, size }) => {
  return (
    <MotiView
      from={{
        translateY: -20,
        translateX: 0,
        opacity: 1,
        rotate: '0deg',
      }}
      animate={{
        translateY: size + 20,
        translateX: Math.sin(particle.id) * 30,
        opacity: 0,
        rotate: `${Math.random() > 0.5 ? '' : '-'}${360 + Math.random() * 180}deg`,
      }}
      transition={{
        duration: 2000 + Math.random() * 1000,
        delay: particle.delay,
        easing: (t) => t * (2 - t), // easeOutQuad
      }}
      style={[
        styles.confettiParticle,
        {
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size * (Math.random() > 0.5 ? 1 : 0.4), // Some are rectangles
          borderRadius: Math.random() > 0.5 ? particle.size / 2 : 2,
        },
      ]}
    />
  );
};

const Confetti: React.FC<ConfettiProps> = ({ visible, onComplete }) => {
  const particles = useMemo(() => {
    const items: ConfettiParticle[] = [];
    for (let i = 0; i < 30; i++) {
      items.push({
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX: Math.random() * 100,
        delay: Math.random() * 500,
        size: 6 + Math.random() * 6,
      });
    }
    return items;
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.confettiContainer}>
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} size={100} />
      ))}
    </View>
  );
};

interface LiquidGaugeProps {
  percentage: number;
  color: string;
  size?: number;
}

const LiquidGauge: React.FC<LiquidGaugeProps> = React.memo(({ percentage, color, size = 100 }) => {
  const clampedPercentage = useMemo(() => Math.min(Math.max(percentage, 0), 100), [percentage]);
  const height = useMemo(() => size * 1.3, [size]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Trigger confetti when reaching 100%
  useEffect(() => {
    if (clampedPercentage >= 100 && !hasCelebrated) {
      setShowConfetti(true);
      setHasCelebrated(true);
    } else if (clampedPercentage < 100) {
      setHasCelebrated(false);
    }
  }, [clampedPercentage, hasCelebrated]);

  return (
    <View style={[styles.container, { width: size, height }]}>
      {/* Confetti Celebration */}
      <Confetti 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      
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
});

LiquidGauge.displayName = 'LiquidGauge';

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
  confettiContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
    overflow: 'hidden',
  },
  confettiParticle: {
    position: 'absolute',
    top: 0,
  },
});

export default LiquidGauge;
