import React from 'react';

export default function Card({
  children,
  className = '',
  variant = 'glass',
  hoverable = true,
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-2xl transition-all duration-300 backdrop-blur-xl border';
  
  const variants = {
    // Keep light text on a reliably dark surface, even when the backdrop is bright.
    glass: 'bg-slate-900/80 border-white/20 shadow-glass text-white',
    darkGlass: 'bg-slate-900/70 border-white/15 shadow-glass text-white',
    solid: 'bg-slate-900 border-slate-800 text-white shadow-lg',
    accent: 'bg-gradient-to-br from-slate-900/85 via-slate-900/60 to-blue-950/40 border-blue-500/30 shadow-glass text-white',
    gold: 'bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/30 border-amber-500/35 shadow-gold-glow text-white',
  };

  const hoverStyles = hoverable
    ? 'hover:border-white/35 hover:bg-slate-800/90 hover:shadow-glass-hover hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.glass} ${hoverStyles} p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}


