// What the guide shows: the tokens it features, the dials of the live card, the steps and the rules.
import type { Preview } from "@/lib/tokens.ts";

type ColourPick = {
  title: string;
  lead: string;
  preview: Preview;
  /** Each token with the plain use the guide prints in place of its technical note. */
  names: [token: string, use: string][];
};

/** The colours the guide shows, by what a reader wants to colour. Every other colour is on the Tokens page. */
export const COLOUR_PICKS: ColourPick[] = [
  {
    title: "Text",
    lead: "Four strengths of text. Body copy never goes lighter than muted.",
    preview: "text",
    names: [
      ["color-text-heading", "Headlines."],
      ["color-text-primary", "Strong text and the default text of a page."],
      ["color-text-secondary", "Body copy and the paragraph under a heading."],
      ["color-text-muted", "Captions, card descriptions and small labels."],
    ],
  },
  {
    title: "Backgrounds",
    lead: "The page, a band that alternates with it, a card, a soft tint and the one dark surface.",
    preview: "fill",
    names: [
      ["color-surface-page", "The page background."],
      ["color-surface-subtle", "A section band that alternates with the page."],
      ["color-surface-card", "The fill of a card."],
      ["color-surface-tint", "A soft tint behind a chip or a callout."],
      [
        "color-surface-inverse",
        "The one dark surface, such as a table header.",
      ],
    ],
  },
  {
    title: "Buttons and links",
    lead: "One action colour. A filled button uses the fill and its label; a link or an outline uses the text colour.",
    preview: "fill",
    names: [
      ["color-action-default", "The fill of the main button."],
      ["color-action-on", "The label on that fill."],
      ["color-action-text", "A link, an outline button label, an eyebrow."],
      [
        "color-action-fill-hover",
        "The fill of the main button under the pointer.",
      ],
    ],
  },
  {
    title: "Lines",
    lead: "Borders of cards, dividers and form fields.",
    preview: "outline",
    names: [
      ["color-border-default", "The border of a card or a chip."],
      ["color-border-subtle", "A quiet divider."],
      ["color-border-control", "The border of a form field."],
    ],
  },
  {
    title: "Messages",
    lead: "Error, success, warning and information. Each has a text colour and a tinted background.",
    preview: "fill",
    names: [
      ["color-feedback-error-default", "An error message."],
      ["color-feedback-success-default", "A confirmation."],
      ["color-feedback-warning-default", "A warning."],
      ["color-feedback-info-default", "A note or a tip."],
    ],
  },
];

/** The radius and shadow roles the guide shows. */
export const SHAPE_PICKS = {
  radius: [
    "radius-xs",
    "radius-sm",
    "radius-md",
    "radius-lg",
    "radius-xl",
    "radius-full",
  ],
  shadow: [
    "shadow-raised",
    "shadow-floating",
    "shadow-popover",
    "shadow-panel",
  ],
};

/** The sizes of the spacing scale the guide draws. */
export const SPACE_PICKS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

/** The dials of the live card: the property, its label and the values a button sets. An empty value clears the dial. */
export const DIALS: {
  property: string;
  label: string;
  values: [label: string, value: string][];
}[] = [
  {
    property: "--ig-size",
    label: "Size",
    values: [
      ["Small", "1"],
      ["Medium", "2"],
      ["Large", ""],
    ],
  },
  {
    property: "--ig-spacing",
    label: "Spacing",
    values: [
      ["Half", "0.5"],
      ["Design", ""],
      ["Double", "2"],
    ],
  },
  {
    property: "--ig-radius-factor",
    label: "Roundness",
    values: [
      ["Square", "0"],
      ["Design", ""],
      ["Round", "1"],
    ],
  },
  {
    property: "--ig-elevation-factor",
    label: "Shadow",
    values: [
      ["None", "0"],
      ["Design", ""],
      ["Double", "2"],
    ],
  },
];
