import React from 'react';
import { Icon } from '../icons/Icon.jsx';

const BORDER = 'var(--igd-border-width-default) solid var(--igd-color-border-default)';
const BADGE = {
  yesOurs: { bg: 'var(--igd-color-background-action)', fg: 'var(--igd-color-foreground-on-action)', icon: <Icon name="check" size="xs" weight="strong" />, sr: 'Yes' },
  yes: { bg: 'var(--igd-table-mark-yes-background)', fg: 'var(--igd-table-mark-yes-foreground)', icon: <Icon name="check" size="xs" weight="strong" />, sr: 'Yes' },
  partial: { bg: 'var(--igd-table-mark-partial-background)', fg: 'var(--igd-table-mark-partial-foreground)', icon: <Icon name="half-circle" size="xs" weight="strong" />, sr: 'Partial' },
  gated: { bg: 'var(--igd-table-mark-partial-background)', fg: 'var(--igd-table-mark-partial-foreground)', icon: <Icon name="lock" size="xs" weight="strong" />, sr: 'Gated' },
  no: { bg: 'var(--igd-table-mark-no-background)', fg: 'var(--igd-table-mark-no-foreground)', icon: <Icon name="close" size="xs" weight="strong" />, sr: 'No' },
};
const SR = { position: 'absolute', width: 'var(--igd-border-width-default)', height: 'var(--igd-border-width-default)', overflow: 'hidden', clipPath: 'inset(50%)' };
const norm = c => (c && typeof c === 'object') ? c : { mark: c === true ? 'yes' : c === false ? 'no' : (c || 'no') };

function BadgeMark({ cell, ours }) {
  const c = norm(cell);
  const b = c.mark === 'yes' && ours ? BADGE.yesOurs : (BADGE[c.mark] || BADGE.no);
  const text = c.text ?? (c.mark === 'yes' ? 'Yes' : c.mark === 'no' ? 'No' : '');
  return (
    <span className="igd-type-body-sm" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--igd-space-gap-xs)', lineHeight: 'var(--igd-type-body-md-line-height)', fontWeight: ours && c.mark === 'yes' ? 'var(--igd-font-weight-semibold)' : 'var(--igd-font-weight-regular)', color: ours && c.mark === 'yes' ? 'var(--igd-color-foreground-heading)' : 'var(--igd-color-foreground-control)' }}>
      <span title={b.sr} style={{ flex: '0 0 auto', width: 'var(--igd-size-icon-lg)', height: 'var(--igd-size-icon-lg)', borderRadius: 'var(--igd-radius-action)', background: b.bg, color: b.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{b.icon}</span>
      <span>{text || <span style={SR}>{b.sr}</span>}</span>
    </span>
  );
}
function PlainMark({ cell }) {
  const on = norm(cell).mark === 'yes';
  return on
    ? <span role="img" aria-label="Included" style={{ color: 'var(--igd-color-foreground-action)', display: 'inline-flex' }}><Icon name="check" size="lg" weight="strong" /></span>
    : <span role="img" aria-label="Not included" style={{ color: 'var(--igd-color-foreground-decorative)', fontSize: 'var(--igd-type-title-md-font-size)', fontWeight: 'var(--igd-font-weight-medium)', lineHeight: 1 }}>—</span>;
}

export function ComparisonTable({ variant = 'comparison', label, columns = [], groups = [], detail, collapsible, verified, sourcesHref, sourcesLabel = 'Sources', style, ...rest }) {
  const isCmp = variant === 'comparison';
  const ours = Math.max(0, columns.findIndex(c => c.highlight));
  const showDetail = isCmp && (detail ?? columns.length === 2);
  const total = groups.reduce((n, g) => n + (g.rows?.length || 0), 0);
  const canCollapse = collapsible ?? total > 15;
  const [closed, setClosed] = React.useState({});
  const tpl = ['minmax(0,1.25fr)', ...columns.map(() => isCmp ? 'minmax(0,0.9fr)' : 'minmax(0,1fr)'), ...(showDetail ? ['minmax(0,2.2fr)'] : [])].join(' ');
  const row = { display: 'grid', gridTemplateColumns: tpl };
  const cellPad = isCmp ? 'var(--igd-space-inset-md) var(--igd-space-inset-xl)' : 'var(--igd-space-inset-md) var(--igd-space-inset-xl)';
  const align = isCmp ? 'flex-start' : 'center';
  const tint = i => i === ours ? 'var(--igd-color-background-tint)' : undefined;
  const caps = { fontSize: 'var(--igd-type-eyebrow-font-size)', fontWeight: 'var(--igd-font-weight-bold)', letterSpacing: 'var(--igd-letter-spacing-label)', textTransform: 'uppercase' };
  const headPad = 'var(--igd-space-inset-md) var(--igd-space-inset-xl)';

  const head = isCmp ? (
    <div role="row" style={{ ...row, background: 'var(--igd-color-background-inverse)', color: 'var(--igd-color-foreground-inverse)' }}>
      <div role="columnheader" style={{ padding: headPad, ...caps }}>{label ?? 'Capability'}</div>
      {columns.map((c, i) => (
        <div role="columnheader" key={i} style={{ padding: headPad, background: i === ours ? 'var(--igd-color-background-action)' : undefined }}>
          <div style={caps}>{c.name}</div>
          {c.sub && <div style={{ fontSize: 'var(--igd-type-eyebrow-font-size)', marginTop: 'var(--igd-space-stack-2xs)', color: i === ours ? 'var(--igd-table-header-sub-foreground-highlighted)' : 'var(--igd-table-header-sub-foreground)' }}>{c.sub}</div>}
        </div>
      ))}
      {showDetail && <div role="columnheader" style={{ padding: headPad, ...caps, color: 'var(--igd-table-header-detail-foreground)' }}>Detail</div>}
    </div>
  ) : (
    <div role="row" style={{ ...row, background: 'var(--igd-color-background-band)', alignItems: 'stretch' }}>
      <div role="columnheader" style={{ padding: 'var(--igd-space-inset-xl)', ...caps, color: 'var(--igd-color-foreground-subtle)', display: 'flex', alignItems: 'flex-end' }}>{label ?? 'Feature'}</div>
      {columns.map((c, i) => (
        <div role="columnheader" key={i} style={{ background: tint(i), display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', textAlign: 'center' }}>
          {c.tab && <div style={{ background: 'var(--igd-color-background-action)', color: 'var(--igd-color-foreground-on-action)', fontSize: 'var(--igd-type-body-2xs-font-size)', fontWeight: 'var(--igd-font-weight-bold)', letterSpacing: 'var(--igd-letter-spacing-label)', textTransform: 'uppercase', padding: 'var(--igd-space-inset-xs) var(--igd-space-inset-xs)' }}>{c.tab}</div>}
          <div className="igd-type-body-md" style={{ padding: c.tab ? 'var(--igd-space-inset-sm) var(--igd-space-inset-md) var(--igd-space-inset-md)' : 'var(--igd-space-inset-xl) var(--igd-space-inset-md)', fontWeight: 'var(--igd-font-weight-bold)', color: 'var(--igd-color-foreground-heading)' }}>{c.name}{c.sub && <div style={{ fontSize: 'var(--igd-type-eyebrow-font-size)', fontWeight: 'var(--igd-font-weight-regular)', color: 'var(--igd-color-foreground-faint)', marginTop: 'var(--igd-space-stack-2xs)' }}>{c.sub}</div>}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={style} {...rest}>
      <div role="table" style={{ border: BORDER, borderRadius: 'var(--igd-radius-card-featured)', overflow: 'clip', boxShadow: 'var(--igd-elevation-1)', background: 'var(--igd-color-background-page)', fontFamily: 'var(--igd-font-body)' }}>
        <div role="rowgroup" style={{ position: 'sticky', top: 0, zIndex: 'var(--igd-z-index-raised)' }}>{head}</div>
        {groups.map((g, gi) => {
          const isClosed = canCollapse && closed[gi];
          return (
            <div role="rowgroup" key={gi}>
              {g.name && (
                <div role="row" style={{ background: 'var(--igd-color-background-band)', borderTop: BORDER }}>
                  <div role="cell" style={{ padding: 0 }}>
                    {React.createElement(canCollapse ? 'button' : 'div', {
                      type: canCollapse ? 'button' : undefined,
                      'aria-expanded': canCollapse ? !isClosed : undefined,
                      onClick: canCollapse ? () => setClosed(s => ({ ...s, [gi]: !s[gi] })) : undefined,
                      style: { display: 'flex', alignItems: 'center', gap: 'var(--igd-space-gap-xs)', width: '100%', padding: 'var(--igd-space-inset-sm) var(--igd-space-inset-xl)', background: 'none', border: 0, textAlign: 'left', cursor: canCollapse ? 'pointer' : 'default', fontFamily: 'inherit', ...caps, color: 'var(--igd-color-foreground-action)' },
                    },
                      canCollapse && <Icon name="chevron-down" size="xs" weight="strong" style={{ transform: isClosed ? 'rotate(-90deg)' : 'none', transition: 'transform var(--igd-duration-fast) var(--igd-easing-default)' }} />,
                      g.name,
                      g.count != null && <span style={{ color: 'var(--igd-color-foreground-faint)', letterSpacing: 'var(--igd-letter-spacing-badge)' }}>{g.count}</span>)}
                  </div>
                </div>
              )}
              {!isClosed && (g.rows || []).map((r, ri) => (
                <div role="row" key={ri} style={{ ...row, borderTop: BORDER }}>
                  <div role="rowheader" className="igd-type-body-md" style={{ padding: cellPad, fontWeight: 'var(--igd-font-weight-semibold)', color: 'var(--igd-color-foreground-heading)' }}>{r.label}</div>
                  {columns.map((c, ci) => (
                    <div role="cell" key={ci} style={{ padding: cellPad, background: tint(ci), display: 'flex', justifyContent: isCmp ? 'flex-start' : 'center', alignItems: align }}>
                      {isCmp ? <BadgeMark cell={r.cells?.[ci]} ours={ci === ours} /> : <PlainMark cell={r.cells?.[ci]} />}
                    </div>
                  ))}
                  {showDetail && <div role="cell" className="igd-type-body-sm" style={{ padding: cellPad, color: 'var(--igd-color-foreground-subtle)', textWrap: 'pretty' }}>{r.detail}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {isCmp && (verified || sourcesHref) && (
        <div className="igd-type-body-xs" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--igd-space-gap-2xs) var(--igd-space-gap-sm)', marginTop: 'var(--igd-space-stack-sm)', color: 'var(--igd-color-foreground-faint)' }}>
          {verified && <span>Last verified {verified}</span>}
          {sourcesHref && <a href={sourcesHref} style={{ color: 'var(--igd-color-foreground-action)', textDecoration: 'none', fontWeight: 'var(--igd-font-weight-semibold)' }}>{sourcesLabel}</a>}
        </div>
      )}
    </div>
  );
}
