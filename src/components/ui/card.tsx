import * as React from 'react';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
