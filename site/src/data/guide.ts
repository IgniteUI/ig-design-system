// What the guide shows: the tokens it features with a plain use each, and the dials of the live card.
import type { Preview } from "@/lib/tokens.ts";

/** A featured colour: the token, the plain use the guide prints, and how it is previewed. */
type ColourPick = {
  token: string;
  use: string;
  /** How this colour is previewed, when it differs from its group. */
  preview?: Preview;
  /** The token of the surface a text colour is shown on. */
  on?: string;
};

type ColourGroup = {
  id: string;
  title: string;
  lead: string;
  preview: Preview;
  picks: ColourPick[];
};

/** The colours the guide shows, by what a reader wants to colour. Every other colour is on the Tokens page. */
export const COLOUR_PICKS: ColourGroup[] = [
  {
    id: "colour-text",
    title: "Text",
    lead: "Four strengths of text. Body copy never goes lighter than muted.",
    preview: "text",
    picks: [
      { token: "color-text-heading", use: "Headlines." },
      {
        token: "color-text-primary",
        use: "Strong text and the default text of a page.",
      },
      {
        token: "color-text-secondary",
        use: "Body copy and the paragraph under a heading.",
      },
      {
        token: "color-text-muted",
        use: "Captions, card descriptions and small labels.",
      },
    ],
  },
  {
    id: "colour-backgrounds",
    title: "Backgrounds",
    lead: "The page, a band that alternates with it, a card, a soft tint and the one dark surface.",
    preview: "fill",
    picks: [
      { token: "color-surface-page", use: "The page background." },
      {
        token: "color-surface-subtle",
        use: "A section band that alternates with the page.",
      },
      { token: "color-surface-card", use: "The fill of a card." },
      {
        token: "color-surface-tint",
        use: "A soft tint behind a chip or a callout.",
      },
      {
        token: "color-surface-inverse",
        use: "The one dark surface, such as a table header.",
      },
    ],
  },
  {
    id: "colour-actions",
    title: "Buttons and links",
    lead: "One action colour. A filled button uses the fill and its label; a link or an outline uses the text colour.",
    preview: "fill",
    picks: [
      { token: "color-action-default", use: "The fill of the main button." },
      {
        token: "color-action-on",
        use: "The label on that fill.",
        preview: "text",
        on: "color-action-default",
      },
      {
        token: "color-action-text",
        use: "A link, an outline button label, a short label in the action colour.",
        preview: "text",
      },
      {
        token: "color-action-fill-hover",
        use: "The fill of the main button under the pointer.",
      },
    ],
  },
  {
    id: "colour-lines",
    title: "Lines",
    lead: "Borders of cards, dividers and form fields.",
    preview: "outline",
    picks: [
      { token: "color-border-default", use: "The border of a card or a chip." },
      { token: "color-border-subtle", use: "A quiet divider." },
      { token: "color-border-control", use: "The border of a form field." },
    ],
  },
  {
    id: "colour-messages",
    title: "Messages",
    lead: "Error, success, warning and information. Each is a text colour shown here on its own tinted background.",
    preview: "text",
    picks: [
      {
        token: "color-feedback-error-default",
        use: "An error message.",
        on: "color-feedback-error-surface",
      },
      {
        token: "color-feedback-success-default",
        use: "A confirmation.",
        on: "color-feedback-success-surface",
      },
      {
        token: "color-feedback-warning-default",
        use: "A warning.",
        on: "color-feedback-warning-surface",
      },
      {
        token: "color-feedback-info-default",
        use: "A note or a tip.",
        on: "color-feedback-info-surface",
      },
    ],
  },
];

/** The plain use of each type role. A role of tokens.json that is missing here stops the build. */
export const TYPE_USES: Record<string, string> = {
  "type-display-lg": "The one headline at the top of the home page.",
  "type-display-md": "The heading of a section.",
  "type-display-sm": "The heading of a sub-section or a panel.",
  "type-stat": "A big number, such as 100K+.",
  "type-title-md": "A product name on a card.",
  "type-title-sm": "The title of a card.",
  "type-lead": "The paragraph under a heading.",
  "type-label-lg": "The label of a large button, or the title of a callout.",
  "type-body-lg": "Running text.",
  "type-body-md": "Text in the interface: menus, buttons, rows of a list.",
  "type-label-md": "The label of a button.",
  "type-body-sm": "A caption, a card description, a detail in a table.",
  "type-eyebrow": "A short uppercase label.",
  "type-body-xs": "Small print: legal copy, a chip.",
  "type-body-2xs": "The smallest label, such as the line under a badge.",
};

/** The radius and shadow roles the guide shows, each with its plain use. */
export const SHAPE_PICKS: Record<
  "radius" | "shadow",
  { token: string; use: string }[]
> = {
  radius: [
    { token: "radius-xs", use: "A checkbox or a small tag." },
    { token: "radius-sm", use: "A small element, such as a badge." },
    { token: "radius-md", use: "An icon tile or a row in a menu." },
    { token: "radius-lg", use: "A card or a picture frame." },
    { token: "radius-xl", use: "A large card that stands out." },
    {
      token: "radius-full",
      use: "A button, a chip, anything shaped like a pill.",
    },
  ],
  shadow: [
    { token: "shadow-raised", use: "A card under the pointer." },
    { token: "shadow-floating", use: "A badge that floats over a picture." },
    { token: "shadow-popover", use: "A dropdown menu." },
    { token: "shadow-panel", use: "An open navigation panel." },
  ],
};

/** The sizes of the spacing scale the guide draws. */
export const SPACE_PICKS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

/**
 * The dials of the live card: the property, its plain label, what a token reads when no dial is set, and the values a button sets.
 * A button with an empty value is the default: it clears the dial. `shown` is the number printed beside its label.
 */
export const DIALS: {
  property: string;
  label: string;
  fallback: string;
  values: [label: string, value: string, shown: string][];
}[] = [
  {
    property: "--ig-size",
    label: "Size",
    fallback: "Large, 3",
    values: [
      ["Small", "1", "1"],
      ["Medium", "2", "2"],
      ["Large", "", "3"],
    ],
  },
  {
    property: "--ig-spacing",
    label: "Spacing",
    fallback: "Normal, 1",
    values: [
      ["Half", "0.5", "0.5"],
      ["Normal", "", "1"],
      ["Double", "2", "2"],
    ],
  },
  {
    property: "--ig-radius-factor",
    label: "Roundness",
    fallback: "Mixed: each radius token keeps its own, 0.67 to 1",
    values: [
      ["Square", "0", "0"],
      ["Mixed", "", ""],
      ["Round", "1", "1"],
    ],
  },
  {
    property: "--ig-elevation-factor",
    label: "Shadow",
    fallback: "Normal, 1",
    values: [
      ["None", "0", "0"],
      ["Normal", "", "1"],
      ["Double", "2", "2"],
    ],
  },
];
