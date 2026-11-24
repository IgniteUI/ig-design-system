import React from 'react';

export function UtilityBar({
  salesLabel = 'North American Sales:', phone = '1-800-231-8588',
  links = [{ label: 'Global Contacts', href: '#' }, { label: 'My Account', href: '#' }],
  style, ...rest
}) {
  return (
    <div className="igd-type-body-xs" style={{
      maxWidth: 'var(--igd-container-max-width)', margin: '0 auto',
      padding: 'var(--igd-space-inset-xs) var(--igd-container-gutter)', display: 'flex', alignItems: 'center',
      flexWrap: 'wrap', justifyContent: 'flex-end', gap: 'var(--igd-space-gap-2xs) clamp(var(--igd-space-gap-xs), 1.6vw, var(--igd-space-gap-xl))',
      fontWeight: 'var(--igd-font-weight-semibold)', color: 'var(--igd-color-text-body)', ...style,
    }} {...rest}>
      <span style={{ whiteSpace: 'nowrap' }}>
        {salesLabel}{' '}
        <a href={'tel:' + phone.replace(/[^0-9]/g, '')} style={{ color: 'var(--igd-color-text-body)', whiteSpace: 'nowrap' }}>{phone}</a>
      </span>
      {links.map(l => (
        <a key={l.label} href={l.href} style={{ color: 'var(--igd-color-link-utility)' }}>{l.label}</a>
      ))}
    </div>
  );
}
