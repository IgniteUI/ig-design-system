import React from 'react';

const ACCENTS = { inverse: 'var(--igd-color-accent-inverse)', 'inverse-alt': 'var(--igd-color-accent-inverse-alt)', primary: 'var(--igd-color-accent-primary)', secondary: 'var(--igd-color-accent-secondary)' };
const OFF = 'calc(-1 * var(--igd-stat-badge-offset))';
const POS = {
  'top-left': { top: OFF, left: OFF }, 'top-right': { top: OFF, right: OFF },
  'bottom-left': { bottom: 'var(--igd-stat-badge-inset)', left: 'var(--igd-stat-badge-inset)' },
  'bottom-right': { bottom: 'var(--igd-stat-badge-inset)', right: 'var(--igd-stat-badge-inset)' },
};

// duration (seconds) overrides --igd-duration-float for this badge only.
export function StatBadge({ value, label, accent = 'inverse', position = 'top-left', duration, style, ...rest }) {
  return (
    <div style={{
      position: 'absolute', ...POS[position], zIndex: 'var(--igd-z-index-media)',
      background: 'var(--igd-color-surface-inverse)', borderRadius: 'var(--igd-radius-md)',
      padding: 'var(--igd-space-inset-sm) var(--igd-space-inset-md)', boxShadow: 'var(--igd-shadow-floating)',
      animation: 'igd-float var(--igd-duration-float) ease-in-out infinite',
      animationDuration: duration != null ? duration + 's' : undefined, ...style,
    }} {...rest}>
      <div className="igd-type-stat" style={{ color: ACCENTS[accent] || accent, whiteSpace: 'nowrap' }}>{value}</div>
      <div className="igd-type-body-2xs" style={{ color: 'var(--igd-color-text-inverse-muted)' }}>{label}</div>
    </div>
  );
}
