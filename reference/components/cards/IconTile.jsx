import React from 'react';

const FILLS = {
  1: 'var(--igd-tile-1)', 2: 'var(--igd-tile-2)',
  3: 'var(--igd-tile-3)', 4: 'var(--igd-tile-4)',
  5: 'var(--igd-tile-5)', 6: 'var(--igd-tile-6)',
  7: 'var(--igd-tile-7)', 8: 'var(--igd-tile-8)',
};

// size is a name from the shared control scale: 'sm' | 'md' | 'lg' | 'xl'  (--igd-size-control-*), or 'tile' (default, --igd-size-tile).
// The tile follows --ig-size like every other control.
// The glyph colour (--igd-tile-on) is derived from the fill: black on light fills, white on dark ones.
export function IconTile({ src, alt = '', fill = 1, size = 'tile', style, children, ...rest }) {
  const box = 'var(--igd-size-' + (size === 'tile' ? 'tile' : 'control-' + size) + ')';
  return (
    <div data-ig="icon-tile" style={{
      '--igd-tile-fill': FILLS[fill] || fill, color: 'var(--igd-tile-on)',
      flex: '0 0 auto', width: box, height: box, borderRadius: 'var(--igd-radius-tile)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--igd-tile-fill)', ...style,
    }} {...rest}>
      {src
        ? <img src={src} alt={alt} style={{ width: box, height: box, display: 'block' }} />
        : children}
    </div>
  );
}
