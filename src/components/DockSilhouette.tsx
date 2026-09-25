import React, { useMemo } from 'react';
import { DockConfig, EASING_FUNCTIONS } from '../types/dock';
import { generateSilhouettePath } from '../utils/geometry';

interface DockSilhouetteProps {
  config: DockConfig;
  height: number;
  isExpanded?: boolean;
}

export const DockSilhouette: React.FC<DockSilhouetteProps> = ({ config, height, isExpanded = false }) => {
  const { 
    shape, 
    width, 
    position, 
    theme, 
    tension,
    heightMode = 'full',
    topOffset = 0,
    bottomOffset = 100,
    autoExpandFullHeight = true,
    borderWidth = 1.2,
    bgOpacity = 96,
    glowIntensity = 'subtle',
    transitionDuration = 320,
    easingCurve = 'spring',
  } = config;

  const easingCss = EASING_FUNCTIONS[easingCurve]?.css || 'cubic-bezier(0.34, 1.45, 0.64, 1)';

  // Determine if we should force 100% full height
  const forceFull = heightMode === 'full' || (autoExpandFullHeight && isExpanded);

  const topRatio = heightMode === 'custom' ? topOffset / 100 : heightMode === 'organic' ? 0.10 : 0;
  const bottomRatio = heightMode === 'custom' ? bottomOffset / 100 : heightMode === 'organic' ? 0.90 : 1.0;

  const pathData = useMemo(() => {
    return generateSilhouettePath(
      shape, 
      width, 
      height, 
      position, 
      tension, 
      topRatio, 
      bottomRatio, 
      forceFull
    );
  }, [shape, width, height, position, tension, topRatio, bottomRatio, forceFull]);

  // Color & gradient styles based on theme
  const themeStyles = useMemo(() => {
    const opacityVal = (bgOpacity ?? 96) / 100;
    const strokeW = borderWidth !== undefined ? borderWidth : 1.2;

    let glowFilter = 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.7))';
    if (glowIntensity === 'none') {
      glowFilter = 'none';
    } else if (glowIntensity === 'vibrant') {
      glowFilter = theme === 'cyberpunk'
        ? 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.6)) drop-shadow(0 0 50px rgba(16, 185, 129, 0.3))'
        : theme === 'midnight'
        ? 'drop-shadow(0 0 25px rgba(147, 51, 234, 0.6)) drop-shadow(0 0 50px rgba(147, 51, 234, 0.3))'
        : theme === 'amber'
        ? 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.5)) drop-shadow(0 0 45px rgba(217, 119, 6, 0.3))'
        : 'drop-shadow(0 0 25px rgba(99, 102, 241, 0.4)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8))';
    }

    switch (theme) {
      case 'glass':
        return {
          fill: 'url(#glassGrad)',
          stroke: 'rgba(255, 255, 255, 0.22)',
          strokeWidth: strokeW,
          filter: glowIntensity === 'vibrant' ? glowFilter : 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.45))',
          opacity: opacityVal,
        };
      case 'midnight':
        return {
          fill: 'url(#midnightGrad)',
          stroke: 'rgba(147, 51, 234, 0.35)',
          strokeWidth: strokeW,
          filter: glowFilter,
          opacity: opacityVal,
        };
      case 'titanium':
        return {
          fill: 'url(#titaniumGrad)',
          stroke: 'rgba(161, 161, 170, 0.30)',
          strokeWidth: strokeW,
          filter: glowFilter,
          opacity: opacityVal,
        };
      case 'cyberpunk':
        return {
          fill: '#08090d',
          stroke: '#10b981',
          strokeWidth: Math.max(1.5, strokeW),
          filter: glowFilter,
          opacity: opacityVal,
        };
      case 'amber':
        return {
          fill: 'url(#amberGrad)',
          stroke: 'rgba(245, 158, 11, 0.45)',
          strokeWidth: strokeW,
          filter: glowFilter,
          opacity: opacityVal,
        };
      case 'nordic':
        return {
          fill: 'url(#nordicGrad)',
          stroke: 'rgba(226, 232, 240, 0.20)',
          strokeWidth: strokeW,
          filter: glowFilter,
          opacity: opacityVal,
        };
      case 'onyx':
      default:
        return {
          fill: 'url(#onyxGrad)',
          stroke: 'rgba(255, 255, 255, 0.14)',
          strokeWidth: strokeW,
          filter: glowFilter,
          opacity: opacityVal,
        };
    }
  }, [theme, bgOpacity, borderWidth, glowIntensity]);

  return (
    <svg
      className="absolute top-0 pointer-events-none"
      style={{
        [position === 'right' ? 'right' : 'left']: 0,
        width: `${width}px`,
        height: `${height}px`,
        filter: themeStyles.filter,
        opacity: width <= 4 ? 0 : themeStyles.opacity,
        transition: `width ${config.transitionDuration || 320}ms ${easingCss}, opacity ${config.transitionDuration || 320}ms ease-out`,
      }}
      viewBox={`0 0 ${Math.max(1, width)} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        {/* Onyx Deep Black gradient */}
        <linearGradient id="onyxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14151a" stopOpacity="0.98" />
          <stop offset="50%" stopColor="#0b0c10" stopOpacity="0.99" />
          <stop offset="100%" stopColor="#050608" stopOpacity="1" />
        </linearGradient>

        {/* Frosted Glass gradient */}
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2d3d" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#12141c" stopOpacity="0.96" />
        </linearGradient>

        {/* Midnight Violet gradient */}
        <linearGradient id="midnightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1338" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0a0518" stopOpacity="0.99" />
        </linearGradient>

        {/* Titanium Brushed dark gradient */}
        <linearGradient id="titaniumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#141417" stopOpacity="0.99" />
        </linearGradient>

        {/* Amber Retro Industrial gradient */}
        <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e1a05" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#140a02" stopOpacity="0.99" />
        </linearGradient>

        {/* Nordic Slate gradient */}
        <linearGradient id="nordicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.99" />
        </linearGradient>
      </defs>

      <path
        d={pathData}
        fill={themeStyles.fill}
        stroke={themeStyles.stroke}
        strokeWidth={themeStyles.strokeWidth}
        className="transition-all duration-300 ease-out"
      />
    </svg>
  );
};
