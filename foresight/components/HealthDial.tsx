import React from 'react';
import { motion } from 'framer-motion';

// Constants for health score thresholds
const SCORE_THRESHOLDS = {
  LOW: 40,
  MEDIUM: 60,
} as const;

const SCORE_COLORS = {
  LOW: '#FF3B5C',    // danger
  MEDIUM: '#FFB800', // warning
  HIGH: '#00D9A5',   // mint
} as const;

const SCORE_LABELS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
} as const;

interface HealthDialProps {
  score: number;
}

const HealthDial: React.FC<HealthDialProps> = ({ score }) => {
  const radius = 80;
  const stroke = 12;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const circumference = radius * Math.PI;
  const arcLength = circumference; // Semi-circle
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  const getColor = (s: number): string => {
    if (s < SCORE_THRESHOLDS.LOW) return SCORE_COLORS.LOW;
    if (s < SCORE_THRESHOLDS.MEDIUM) return SCORE_COLORS.MEDIUM;
    return SCORE_COLORS.HIGH;
  };

  const getLabel = (s: number): string => {
    if (s > 75) return SCORE_LABELS.EXCELLENT;
    if (s > 50) return SCORE_LABELS.GOOD;
    return SCORE_LABELS.FAIR;
  };

  const color = getColor(normalizedScore);
  const label = getLabel(normalizedScore);

  return (
    <div 
      className="relative w-48 h-28 flex justify-center overflow-hidden"
      role="meter"
      aria-valuenow={normalizedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Financial health score: ${normalizedScore} out of 100, ${label}`}
    >
      <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110" aria-hidden="true">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength}
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Label */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <span className="text-3xl font-light text-white font-sans block">{score}</span>
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color }}>
            {label}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthDial;
