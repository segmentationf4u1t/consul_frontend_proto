'use client';

import { AnimatedMazeBackground } from './animated-maze-background';
import { ReactNode } from 'react';

interface MazeBackgroundWrapperProps {
  children: ReactNode;
  cellSize?: number;
  animationSpeed?: number;
  opacity?: number;
  color?: string;
  className?: string;
}

/**
 * A wrapper component that adds the animated maze background to any content.
 * Perfect for landing pages, auth pages, or any full-screen layouts.
 */
export const MazeBackgroundWrapper: React.FC<MazeBackgroundWrapperProps> = ({
  children,
  cellSize = 25,
  animationSpeed = 75,
  opacity = 0.08,
  color = '#64748b',
  className = ''
}) => {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Animated Background */}
      <AnimatedMazeBackground
        cellSize={cellSize}
        animationSpeed={animationSpeed}
        opacity={opacity}
        color={color}
        className="absolute inset-0"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MazeBackgroundWrapper;