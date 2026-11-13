import React from 'react';

export function Eyebrow({ children, color = 'var(--igd-color-action-text)', style, ...rest }) {
  return (
    <div className="igd-type-overline" style={{ color, marginBottom: 'var(--igd-space-stack-md)', ...style }} {...rest}>{children}</div>
  );
}
