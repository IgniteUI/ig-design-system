import React from 'react';

const DOTS = ['var(--igd-window-dot-red)', 'var(--igd-window-dot-amber)', 'var(--igd-window-dot-green)'];

export function BrowserFrame({ src, alt = '', children, bleed = false, style, ...rest }) {
  return (
    <div style={{
      width: bleed ? 'calc(100% + max(var(--igd-space-4xl), (100vw - var(--igd-bleed-width)) / 2))' : '100%',
      borderRadius: 'var(--igd-radius-lg)', overflow: 'hidden',
      border: 'var(--igd-border-width-default) solid var(--igd-color-border-default)', boxShadow: 'var(--igd-shadow-overlay)',
      background: 'var(--igd-color-surface-page)', ...style,
    }} {...rest}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--igd-space-gap-xs)', padding: 'var(--igd-space-inset-xs) var(--igd-space-inset-sm)',
        borderBottom: 'var(--igd-border-width-default) solid var(--igd-color-border-subtle)', background: 'var(--igd-color-surface-subtle)',
      }}>
        {DOTS.map(c => (
          <span key={c} style={{ width: 'var(--igd-window-dot-size)', height: 'var(--igd-window-dot-size)', borderRadius: '50%', background: c }} />
        ))}
      </div>
      {src ? <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} /> : children}
    </div>
  );
}
