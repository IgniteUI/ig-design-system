// The event the scripts use to say that rendered values may have changed: the theme, the type set or a dial.

export const CHANGE = "igd:change";

/** Tells every readout to measure again. */
export const changed = () => document.dispatchEvent(new CustomEvent(CHANGE));
