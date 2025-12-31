import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HealthDialProps {
  score: number;
}

const HealthDial: React.FC<HealthDialProps> = ({ score }) => {
  // Score 0-100
  // Angle: -180 to 0 (semi-circle top)
  // Let's do a 240 degree arc (-210 to -330? No. 120 deg spread? let's do simple half circle)
  // Standard gauge: 180 degrees.
  
  const radius = 80;
  const stroke = 12;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const circumference = radius * Math.PI;
  const arcLength = circumference; // Semi-circle
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  const getColor = (s: number) => {
    if (s < 40) return '#FF3B5C';
    if (s < 60) return '#FFB800';
    return '#00D9A5';
  };

  const color = getColor(normalizedScore);

  return (
    <div className="relative w-48 h-28 flex justify-center overflow-hidden">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
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
          strokeDashoffset={arcLength} // Start empty
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Needle/Label */}
      <div className="absolute bottom-0 flex flex-col items-center">
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1 }}
           className="text-center"
         >
            <span className="text-3xl font-light text-white font-sans block">{score}</span>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color }}>
                {score > 75 ? 'Excellent' : score > 50 ? 'Good' : 'Fair'}
            </span>
         </motion.div>
      </div>
    </div>
  );
};

export default HealthDial;
