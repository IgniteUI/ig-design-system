import React from 'react';

export function ProductCard({
  name, description, logo, monogram, badge, variant = 'default',
  showName = true, footer, style, children, ...rest
}) {
  const bundle = variant === 'bundle';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', position: 'relative',
      borderRadius: 'var(--igd-radius-xl)', padding: 'var(--igd-space-inset-xl)',
      ...(bundle
        ? { border: 'var(--igd-border-width-strong) solid transparent', background: 'var(--igd-gradient-border-bundle)', boxShadow: 'var(--igd-shadow-accent-md)' }
        : { border: 'var(--igd-border-width-default) solid var(--igd-color-border-subtle)', background: 'var(--igd-color-surface-card)', boxShadow: 'var(--igd-shadow-none)' }),
      ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--igd-space-gap-sm)', marginBottom: 'var(--igd-space-stack-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--igd-space-gap-xs)', minWidth: 0 }}>
          {logo && <img src={logo} alt={name} style={{ height: 'var(--igd-product-logo-height)', maxWidth: 'var(--igd-product-logo-max-width)', width: 'auto', objectFit: 'contain', display: 'block', flex: '0 0 auto' }} />}
          {!logo && monogram}
          {showName && <div className="igd-type-h6" style={{ color: 'var(--igd-color-text-heading)' }}>{name}</div>}
        </div>
        {badge}
      </div>
      {description && (
        <div className="igd-type-caption" style={{ color: 'var(--igd-color-text-muted)', marginBottom: 'var(--igd-space-stack-md)', flex: 1 }}>{description}</div>
      )}
      {children}
      {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
    </div>
  );
}
