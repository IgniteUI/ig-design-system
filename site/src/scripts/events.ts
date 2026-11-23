// The events of the scripts: one says that rendered values may have changed (the theme, the type set or a dial), one that the readouts have written them.

export const CHANGE = "igd:change";

/** The event the readouts send after they have written their values. */
export const READ = "igd:read";

/** Tells every readout to measure again. */
export const changed = () => document.dispatchEvent(new CustomEvent(CHANGE));
