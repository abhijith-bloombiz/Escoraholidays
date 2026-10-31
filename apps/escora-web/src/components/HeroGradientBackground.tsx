import React from 'react';

interface HeroGradientBackgroundProps {
  hasImage?: boolean;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroGradientBackground({
  hasImage = false,
  opacity = 1,
  className = '',
  style = {}
}: HeroGradientBackgroundProps) {
  return (
    <div
      className={`hero-gradient-animated-wrap ${className}`}
      style={{
        opacity,
        mixBlendMode: hasImage ? 'screen' : 'normal',
        ...style
      }}
      aria-hidden="true"
    >
      {!hasImage && <div className="hero-gradient-flow-layer" />}
      <div className="hero-gradient-aurora-primary" />
      <div className="hero-gradient-aurora-secondary" />
      <div className="hero-gradient-sweep-line" />
    </div>
  );
}
