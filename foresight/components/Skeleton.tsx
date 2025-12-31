import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}) => {
  const baseClasses = 'bg-surface-300 overflow-hidden relative';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-400/50 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'linear',
          repeatDelay: 0.5 
        }}
      />
    </div>
  );
};

// Pre-built skeleton patterns for common UI elements
export const TransactionItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-surface-200/50 border-b border-surface-300/30">
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" width={120} height={14} />
        <Skeleton variant="text" width={80} height={12} />
      </div>
    </div>
    <Skeleton variant="text" width={60} height={16} />
  </div>
);

export const GoalCardSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-3 min-w-[100px]">
    <Skeleton variant="rectangular" width={90} height={117} className="rounded-2xl" />
    <div className="text-center flex flex-col gap-1">
      <Skeleton variant="text" width={60} height={14} />
      <Skeleton variant="text" width={40} height={12} />
    </div>
  </div>
);

export const BillItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-surface-200 rounded-xl border border-surface-300">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={8} height={8} />
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" width={100} height={14} />
        <Skeleton variant="text" width={60} height={12} />
      </div>
    </div>
    <Skeleton variant="text" width={50} height={16} />
  </div>
);

export const InsightCardSkeleton: React.FC = () => (
  <div className="bg-surface-200 rounded-3xl p-6 border border-surface-300">
    <div className="flex items-start gap-4 mb-4">
      <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton variant="text" width="80%" height={18} />
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="60%" height={14} />
      </div>
    </div>
    <Skeleton variant="rectangular" height={80} className="mb-4 rounded-xl" />
    <div className="flex gap-3">
      <Skeleton variant="rectangular" height={40} className="flex-1 rounded-xl" />
      <Skeleton variant="rectangular" height={40} className="flex-1 rounded-xl" />
    </div>
  </div>
);

export const DashboardHeroSkeleton: React.FC = () => (
  <div className="bg-surface-200 rounded-3xl p-6 border border-surface-300">
    <Skeleton variant="text" width={80} height={12} className="mb-4" />
    <Skeleton variant="text" width={180} height={48} className="mb-2" />
    <Skeleton variant="text" width={120} height={14} className="mb-6" />
    <div className="pt-4 border-t border-surface-300/50 flex justify-between">
      <div className="flex flex-col gap-1">
        <Skeleton variant="text" width={50} height={12} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton variant="text" width={50} height={12} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton variant="text" width={50} height={12} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
    </div>
  </div>
);

export default Skeleton;

