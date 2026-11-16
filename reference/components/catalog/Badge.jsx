import React from 'react';

const KINDS = {
  bundle: {
    type: 'body-2xs', background: 'var(--igd-badge-bundle-background)', color: 'var(--igd-badge-bundle-color)',
    fontFamily: 'var(--igd-font-display)', fontWeight: 'var(--igd-font-weight-bold)', letterSpacing: 'var(--igd-letter-spacing-badge)',
    textTransform: 'uppercase', padding: 'var(--igd-space-inset-2xs) var(--igd-space-inset-xs)', borderRadius: 'var(--igd-radius-full)',
  },
  oss: {
    type: 'body-2xs', background: 'var(--igd-badge-oss-background)', color: 'var(--igd-badge-oss-color)',
    fontWeight: 'var(--igd-font-weight-bold)', letterSpacing: 'var(--igd-letter-spacing-badge)',
    padding: 'var(--igd-space-inset-3xs) var(--igd-space-inset-xs)', borderRadius: 'var(--igd-radius-xs)',
  },
  mono: {
    type: 'body-xs', background: 'var(--igd-color-surface-tint)', color: 'var(--igd-color-action-text)',
    fontFamily: 'var(--igd-font-display)', fontWeight: 'var(--igd-font-weight-extrabold)', letterSpacing: 'var(--igd-letter-spacing-mono)',
    height: 'var(--igd-badge-mono-size)', minWidth: 'var(--igd-badge-mono-size)', padding: '0 var(--igd-space-inset-xs)',
    borderRadius: 'var(--igd-radius-sm)', justifyContent: 'center',
  },
};

export function Badge({ kind = 'bundle', children, style, ...rest }) {
  const { type, ...k } = KINDS[kind] || KINDS.bundle;
  return (
    <span className={'igd-type-' + type} style={{
      flex: '0 0 auto', display: 'inline-flex', alignItems: 'center',
      whiteSpace: 'nowrap', ...k, ...style,
    }} {...rest}>{children}</span>
  );
}
