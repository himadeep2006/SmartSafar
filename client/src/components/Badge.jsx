import React from 'react';

export default function Badge({
  children,
  variant = 'gold',
  size = 'md',
  icon = null,
  className = '',
}) {
  const variants = {
    gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    slate: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border backdrop-blur-sm ${variants[variant] || variants.gold} ${sizes[size]} ${className}`}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
