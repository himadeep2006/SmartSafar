import React from 'react';

export default function LoadingState({ message = 'Loading SmartSafar...', height = 'h-64' }) {
  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center space-y-4 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md p-6`}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-amber-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-sky-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="text-sm font-medium text-slate-300 animate-pulse">{message}</p>
    </div>
  );
}
