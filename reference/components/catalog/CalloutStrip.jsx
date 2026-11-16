import React from 'react';
import { Icon } from '../icons/Icon.jsx';

// Release strip: rest, hover and keyboard-focus looks are CSS ([data-ig="release-strip"]).
function ReleaseStrip({ href, label = 'Latest Release', title, body, linkLabel = 'Read More', style, ...rest }) {
  const nw = { whiteSpace: 'nowrap' };
  return (
    <a href={href} className="igd-type-body-md" data-ig="release-strip" style={style} {...rest}>
      <span className="igd-type-eyebrow" data-ig-label="" style={nw}>{label}</span>
      <span style={{ ...nw, fontWeight: 'var(--igd-font-weight-semibold)', color: 'var(--igd-color-text-heading)' }}>{title}</span>
      {body && <span style={{ ...nw, color: 'var(--igd-color-text-secondary)' }}>{body}</span>}
      <span style={{ ...nw, display: 'inline-flex', alignItems: 'center', gap: 'var(--igd-space-gap-xs)', fontWeight: 'var(--igd-font-weight-semibold)', color: 'var(--igd-color-action-text)' }}>
        {linkLabel}
        <Icon name="arrow-right" size="sm" />
      </span>
    </a>
  );
}

export function CalloutStrip({ kind = 'default', title, body, action, style, ...rest }) {
  if (kind === 'release') return <ReleaseStrip title={title} body={body} style={style} {...rest} />;
  const { href, label, linkLabel, ...divRest } = rest;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--igd-space-gap-md)', padding: 'var(--igd-space-inset-xl) var(--igd-space-inset-xl)',
      borderRadius: 'var(--igd-radius-xl)', background: 'var(--igd-color-surface-subtle)',
      border: 'var(--igd-border-width-default) solid var(--igd-color-border-subtle)', flexWrap: 'wrap', ...style,
    }} {...divRest}>
      <div style={{ flex: 1, minWidth: 'var(--igd-callout-min-width)' }}>
        <div className="igd-type-label-lg" style={{ color: 'var(--igd-color-text-heading)', marginBottom: 'var(--igd-space-stack-2xs)' }}>{title}</div>
        {body && <div className="igd-type-body-sm" style={{ color: 'var(--igd-color-text-muted)' }}>{body}</div>}
      </div>
      {action}
    </div>
  );
}
