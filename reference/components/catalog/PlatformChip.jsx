import React from 'react';

export function PlatformChip({ children, href, style, ...rest }) {
  return <a href={href} className="igd-type-body-xs" data-ig="platform-chip" style={style} {...rest}>{children}</a>;
}
