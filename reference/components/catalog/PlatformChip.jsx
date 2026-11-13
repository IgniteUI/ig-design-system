import React from 'react';

export function PlatformChip({ children, href, style, ...rest }) {
  return <a href={href} className="igd-type-detail-1" data-ig="platform-chip" style={style} {...rest}>{children}</a>;
}
