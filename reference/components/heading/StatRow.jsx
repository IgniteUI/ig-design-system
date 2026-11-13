import React from 'react';

export function StatRow({ stats = [], align = 'center', style, ...rest }) {
  return (
    <div className="igd-type-body-2" style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 'var(--igd-space-gap-xs) var(--igd-space-gap-xl)', color: 'var(--igd-color-text-muted)', ...style,
    }} {...rest}>
      {stats.map((s, i) => (
        <span key={i}><b style={{ color: 'var(--igd-color-text-muted)' }}>{s.value}</b> {s.label}</span>
      ))}
    </div>
  );
}
