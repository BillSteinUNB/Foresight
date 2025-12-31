import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { clamp } from '../utils';

interface LiquidGaugeProps {
  percentage: number;
  color: string;
  size?: number;
}

const LiquidGauge: React.FC<LiquidGaugeProps> = ({ percentage, color, size = 100 }) => {
  const clampedPercentage = useMemo(() => clamp(percentage, 0, 100), [percentage]);

  const containerStyle = useMemo(() => ({
    width: size,
    height: size * 1.3
  }), [size]);

  const liquidStyle = useMemo(() => ({
    background: `linear-gradient(0deg, ${color} 0%, ${color}88 100%)`
  }), [color]);

  return (
    <div 
      className="relative overflow-hidden bg-surface-300 rounded-2xl border border-surface-400/30"
      style={containerStyle}
      role="meter"
      aria-valuenow={Math.round(clampedPercentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(clampedPercentage)}% complete`}
    >
      {/* Glass Reflection */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-20" 
        aria-hidden="true"
      />
      
      {/* Liquid Container */}
      <div className="absolute bottom-0 left-0 w-full h-full z-10 flex flex-col justify-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${clampedPercentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-full relative"
          style={liquidStyle}
        >
          {/* Wave SVG Animation */}
          <div 
            className="absolute -top-3 left-0 w-[200%] h-4 flex opacity-80"
            style={{ color: color }}
            aria-hidden="true"
          >
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-full h-full flex"
            >
              <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
                <path fill="currentColor" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,181.3C672,192,768,160,864,138.7C960,117,1056,107,1152,112C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
              <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
                <path fill="currentColor" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,181.3C672,192,768,160,864,138.7C960,117,1056,107,1152,112C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Label inside */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <span className="font-mono font-bold text-white drop-shadow-md text-sm">
          {Math.round(clampedPercentage)}%
        </span>
      </div>
    </div>
  );
};

export default LiquidGauge;
