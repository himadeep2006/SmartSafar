import React from 'react';

export default function Button({
  as: Component = 'button',
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  icon = null,
  type = 'button',
  ...props
}) {
  const isButton = Component === 'button';
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-gradient-to-r from-[#1685f4] to-[#0875dc] text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 focus:ring-blue-500 border border-blue-400/30',
    secondary: 'bg-slate-900/80 text-white hover:bg-slate-800/90 border border-white/20 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 focus:ring-slate-500',
    glass: 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 focus:ring-white/50',
    gold: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/45 hover:-translate-y-0.5 focus:ring-amber-400 border border-amber-300/40',
    ghost: 'text-slate-200 hover:text-white hover:bg-white/10 focus:ring-white/30',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 hover:shadow-lg hover:shadow-red-600/40 hover:-translate-y-0.5 focus:ring-red-500 border border-red-500/30',
    outline: 'border border-blue-500/60 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 focus:ring-blue-500',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
    xl: 'px-9 py-4 text-lg gap-3',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <Component
      type={isButton ? type : undefined}
      onClick={onClick}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </Component>
  );
}

