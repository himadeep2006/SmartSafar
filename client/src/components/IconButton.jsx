import React from 'react';

export default function IconButton({
  icon,
  onClick,
  title,
  variant = 'glass',
  size = 'md',
  disabled = false,
  className = '',
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    glass: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30',
    gold: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30',
    primary: 'bg-blue-600 text-white hover:bg-blue-500',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/10',
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${baseStyles} ${variants[variant] || variants.glass} ${sizes[size] || sizes.md} ${className}`}
    >
      {icon}
    </button>
  );
}
