// The example component of the guide.

/** The rule of the card on the page. The guide prints the same text as its code sample. */
export const CARD_RULE = `.card {
  display: grid;
  gap: var(--igd-space-gap-sm);
  padding: var(--igd-space-inset-lg);
  border: var(--igd-border-width-default) solid var(--igd-color-border-default);
  border-radius: var(--igd-radius-card);
  background: var(--igd-color-surface-card);
  color: var(--igd-color-text-body);
  box-shadow: var(--igd-shadow-raised);
}`;

/** The markup of the card, as the guide prints it. */
export const CARD_MARKUP = `<article class="card" data-ig-scope>
  <h3 class="igd-type-title-sm">Card title</h3>
  <p class="igd-type-body-md">Card text.</p>
</article>`;
