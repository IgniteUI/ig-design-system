import React from 'react';

export function TrustChip({ children, style, ...rest }) {
  return (
    <div className="igd-type-body-sm" style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--igd-space-gap-xs)', padding: 'var(--igd-space-inset-xs) var(--igd-space-inset-md)',
      border: 'var(--igd-border-width-default) solid var(--igd-color-border-default)', background: 'var(--igd-color-background-tint)',
      borderRadius: 'var(--igd-radius-action)', fontWeight: 'var(--igd-font-weight-medium)', color: 'var(--igd-color-foreground-control)', whiteSpace: 'nowrap', ...style,
    }} {...rest}>{children}</div>
  );
}
