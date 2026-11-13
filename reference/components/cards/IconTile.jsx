import React from 'react';

const FILLS = {
  blue: 'var(--igd-tile-blue)', violet: 'var(--igd-tile-violet)',
  pink: 'var(--igd-tile-pink)', teal: 'var(--igd-tile-teal)',
  cyan: 'var(--igd-tile-cyan)', amber: 'var(--igd-tile-amber)',
  royal: 'var(--igd-tile-royal)', ink: 'var(--igd-tile-ink)',
};

// size is a name from the shared control scale: 'sm' | 'md' | 'lg' | 'xl'  (--igd-size-control-*), or 'tile' (default, --igd-size-tile).
// The tile follows --ig-size like every other control.
// The glyph colour (--igd-tile-on) is derived from the fill: black on light fills, white on dark ones.
export function IconTile({ src, alt = '', fill = 'blue', size = 'tile', style, children, ...rest }) {
  const box = 'var(--igd-size-' + (size === 'tile' ? 'tile' : 'control-' + size) + ')';
  return (
    <div data-ig="icon-tile" style={{
      '--igd-tile-fill': FILLS[fill] || fill, color: 'var(--igd-tile-on)',
      flex: '0 0 auto', width: box, height: box, borderRadius: 'var(--igd-radius-md)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--igd-tile-fill)', ...style,
    }} {...rest}>
      {src
        ? <img src={src} alt={alt} style={{ width: box, height: box, display: 'block' }} />
        : children}
    </div>
  );
}
