import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon = '🧭',
  title = 'No Items Found',
  description = 'There is no data to display right now.',
  actionText = null,
  onAction = null,
}) {
  return (
    <div className="w-full p-8 sm:p-12 text-center rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-glass">
        {icon}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="gold" size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
}
