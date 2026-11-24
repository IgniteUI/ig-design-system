import React from 'react';

export function SectionHeading({
  children, accent, level = 2, align = 'left', lead, maxWidth, style, ...rest
}) {
  const Tag = 'h' + level;
  return (
    <div style={{ textAlign: align, maxWidth, margin: align === 'center' ? '0 auto' : undefined, ...style }} {...rest}>
      <Tag className={level === 1 ? 'igd-type-display-lg' : 'igd-type-display-md'} style={{ color: 'var(--igd-color-text-heading)', margin: '0 0 var(--igd-space-stack-lg)' }}>
        {children}
        {accent && (
          <span style={{
            background: 'var(--igd-gradient-brand)', WebkitBackgroundClip: 'text',
            backgroundClip: 'text', color: 'transparent',
          }}> {accent}</span>
        )}
      </Tag>
      {lead && <p className="igd-type-body-lg" style={{ color: 'var(--igd-color-text-body)', margin: 0 }}>{lead}</p>}
    </div>
  );
}
