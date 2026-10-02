import React from 'react';

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
  title = null,
  subtitle = null,
  badge = null,
  action = null,
  bgImage = null,
}) {
  return (
    <div className={`min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative ${className}`}>
      {/* Optional Background Image Overlay */}
      {bgImage && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={bgImage}
            alt="Background"
            className="w-full h-full object-cover opacity-20 filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950" />
        </div>
      )}

      {/* Main Container Content */}
      <div className={`relative z-10 mx-auto ${maxWidth} space-y-8 animate-fade-in`}>
        {(title || subtitle || badge || action) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
            <div>
              {badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3">
                  {badge}
                </div>
              )}
              {title && (
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-slate-400 text-base sm:text-lg mt-1.5 max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>

            {action && (
              <div className="shrink-0">
                {action}
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
