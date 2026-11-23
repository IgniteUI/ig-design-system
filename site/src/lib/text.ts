// Turns a usage note of tokens.json into markup.

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Escapes a note and turns its backticked names into <code>. */
export const prose = (s: string) =>
  esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

/** Splits a note into its first sentence and the rest. A full stop inside backticks or a number does not end it. */
export const lead = (s: string): [first: string, rest: string] => {
  const m = s.match(/^((?:`[^`]*`|[^.`]|\.(?=\S))+\.)\s+(.+)$/s);
  return m ? [m[1], m[2]] : [s, ""];
};
