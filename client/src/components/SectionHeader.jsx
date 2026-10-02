import React from 'react';

export default function SectionHeader({
  title,
  subtitle = null,
  action = null,
  badge = null,
  icon = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        {badge && (
          <span className="inline-block px-3 py-0.5 mb-2 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            {badge}
          </span>
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-xl text-amber-400">{icon}</span>}
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-slate-400 text-sm mt-1">
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
  );
}
