import React from 'react';

export default function GlassPanel({
  children,
  className = '',
  intensity = 'medium',
  glow = false,
  padding = 'p-6',
  ...props
}) {
  const intensities = {
    light: 'bg-slate-900/40 backdrop-blur-sm border-white/10',
    medium: 'bg-slate-900/65 backdrop-blur-md border-white/15',
    heavy: 'bg-slate-900/85 backdrop-blur-xl border-white/20',
  };

  const glowClass = glow ? 'shadow-gold-glow border-amber-500/30' : 'shadow-glass';

  return (
    <div
      className={`rounded-2xl border ${intensities[intensity] || intensities.medium} ${glowClass} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
