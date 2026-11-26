// How a colour name reads: color-{property}-{job}-{emphasis}-{state}. llms.txt, the README and the site print these lists.

/** The second word of a semantic colour name: where the colour goes. */
export const PROPERTIES = [
  {
    word: "foreground",
    means:
      "anything drawn on a background: text, icons, lines inside a component",
  },
  { word: "background", means: "a fill: a page, a band, a card, a button" },
  { word: "border", means: "the edge of a box or a control" },
  { word: "focus", means: "the keyboard focus ring" },
  {
    word: "accent",
    means: "a brand colour for graphics: gradients, tiles, stat numbers",
  },
] as const;

/** The words that say how strong a colour is, strongest first, and the one for a dark area. */
export const EMPHASIS = [
  { word: "strong", means: "more contrast than the default" },
  { word: "default", means: "the usual choice" },
  { word: "subtle", means: "less contrast: supporting text, a quiet line" },
  { word: "faint", means: "the least contrast: captions, small labels" },
  {
    word: "inverse",
    means:
      "for an area that stays dark in both variants, such as the footer; never on a light surface",
  },
] as const;

/** The last word of a colour for an interactive element. */
export const STATES = [
  { word: "hover", means: "on hover" },
  { word: "active", means: "while pressed" },
  { word: "selected", means: "chosen, such as the current tab" },
  { word: "disabled", means: "not available" },
] as const;

/** Words a colour name does not use, each with the word it uses instead. */
export const NOT_USED: Record<string, string> = {
  text: "foreground",
  icon: "foreground",
  surface: "background",
  muted: "faint or subtle",
  primary: "a job word, such as action",
  secondary: "a job word",
  alt: "a job word",
  pressed: "active",
};

/** The parts of a name, in order, each with what it says. The Guide's Naming page draws a name split into them. */
export const PARTS = [
  { part: "color", says: "the category: this value is a colour" },
  {
    part: "property",
    says: "where it goes: foreground, background, border, focus or accent",
  },
  { part: "job", says: "what it is for: link, action, error, page, card" },
  {
    part: "emphasis",
    says: "how strong it is, when there is a choice: strong, default, subtle, faint, inverse",
  },
  {
    part: "state",
    says: "the state of an interactive element, last: hover, active, selected, disabled",
  },
] as const;

/** Examples of names split into their parts, for the Guide's Naming page. */
export const EXAMPLES: readonly {
  name: string;
  parts: string[];
  reads: string;
}[] = [
  {
    name: "color-foreground-link-hover",
    parts: ["color", "foreground", "link", "hover"],
    reads: "the foreground colour of a link, on hover",
  },
  {
    name: "color-background-action",
    parts: ["color", "background", "action"],
    reads: "the fill of an action, such as the main button",
  },
  {
    name: "color-foreground-inverse-faint",
    parts: ["color", "foreground", "inverse", "faint"],
    reads: "faint text on a dark area",
  },
  {
    name: "badge-new-foreground",
    parts: ["badge", "new", "foreground"],
    reads: "a component's own colour: the label of the New badge",
  },
];

/** The steps to name a new colour token. The Guide's Naming page and AGENTS.md follow them. */
export const NEW_NAME_STEPS = [
  "Check that no token already does the job: search the Tokens page by the job, not by the colour.",
  "Pick the property: where does the colour go? Text or an icon is foreground; a fill is background; an edge is border.",
  "Name the job: what is it for? Reuse a job word that exists, such as link, action, error, page or card. A new job word names a job, never a hue, a shape, a product or a page.",
  "Add an emphasis word only when the job has more than one strength, and only from the list. The usual one needs none.",
  "Add a state word last, only for an interactive element.",
  "A colour on a fill says so: foreground-on-{job}, such as color-foreground-on-action.",
  "A colour only one component uses goes in the component tier: {component}-{part}-{property}-{state}, such as badge-new-foreground.",
  "Read the name aloud as a sentence. If it does not say where the colour goes and what it is for, rename it. The naming test checks the words.",
] as const;
