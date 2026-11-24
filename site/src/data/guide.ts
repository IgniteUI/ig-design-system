// What the guide shows: the tokens it features with a plain use each, and the dials of the live card.

/** A featured colour: the token, the short label of its button and the plain use the guide prints. */
type ColourPick = {
  token: string;
  label: string;
  use: string;
};

type ColourGroup = {
  id: string;
  title: string;
  lead: string;
  picks: ColourPick[];
};

/** The colours the guide shows, by what a reader wants to colour. Every other colour is on the Tokens page. */
export const COLOUR_PICKS: ColourGroup[] = [
  {
    id: "colour-text",
    title: "Text",
    lead: "Four strengths of text. Body copy never goes lighter than muted.",
    picks: [
      { token: "color-text-heading", label: "Heading", use: "Headlines." },
      {
        token: "color-text-primary",
        label: "Strong text",
        use: "Strong text and the default text of a page.",
      },
      {
        token: "color-text-secondary",
        label: "Body text",
        use: "Body copy and the paragraph under a heading.",
      },
      {
        token: "color-text-muted",
        label: "Muted text",
        use: "Captions, card descriptions and small labels.",
      },
    ],
  },
  {
    id: "colour-backgrounds",
    title: "Backgrounds",
    lead: "The page, a band that alternates with it, a card and a soft tint.",
    picks: [
      {
        token: "color-surface-page",
        label: "Page",
        use: "The page background.",
      },
      {
        token: "color-surface-subtle",
        label: "Band",
        use: "A section band that alternates with the page.",
      },
      {
        token: "color-surface-card",
        label: "Card",
        use: "The fill of a card.",
      },
      {
        token: "color-surface-tint",
        label: "Tint",
        use: "A soft tint behind a chip or a callout.",
      },
    ],
  },
  {
    id: "colour-inverse",
    title: "Inverse: areas that stay dark",
    lead: "Inverse means for an area that is dark in both variants of the theme, such as the footer, a table header or a stat panel. It is not the dark variant. Each inverse colour is shown here on the inverse surface it is made for.",
    picks: [
      {
        token: "color-surface-inverse",
        label: "Dark area",
        use: "An area that stays dark in both variants of the theme, such as a footer. Inverse does not mean the dark variant.",
      },
      {
        token: "color-text-inverse",
        label: "Text",
        use: "Text in a dark area.",
      },
      {
        token: "color-text-inverse-muted",
        label: "Quiet text",
        use: "Labels and quieter text in a dark area.",
      },
      {
        token: "color-link-inverse",
        label: "Link",
        use: "A link in a dark area.",
      },
    ],
  },
  {
    id: "colour-actions",
    title: "Buttons and links",
    lead: "One action colour. A filled button uses the fill and its label; a link or an outline uses the text colour.",
    picks: [
      {
        token: "color-action-default",
        label: "Button",
        use: "The fill of the main button.",
      },
      {
        token: "color-action-on",
        label: "Button label",
        use: "The label on that fill.",
      },
      {
        token: "color-action-text",
        label: "Link",
        use: "A link, an outline button label, a short label in the action colour.",
      },
      {
        token: "color-action-fill-hover",
        label: "Button hover",
        use: "The fill of the main button under the pointer.",
      },
    ],
  },
  {
    id: "colour-lines",
    title: "Lines",
    lead: "Borders of cards, dividers and form fields.",
    picks: [
      {
        token: "color-border-default",
        label: "Card border",
        use: "The border of a card or a chip.",
      },
      {
        token: "color-border-subtle",
        label: "Divider",
        use: "A quiet divider.",
      },
      {
        token: "color-border-control",
        label: "Field border",
        use: "The border of a form field.",
      },
    ],
  },
  {
    id: "colour-messages",
    title: "Messages",
    lead: "Error, success, warning and information, as a site shows them: an icon and a title in the message colour, on a soft tint of it.",
    picks: [
      {
        token: "color-feedback-error-default",
        label: "Error",
        use: "An error message.",
      },
      {
        token: "color-feedback-success-default",
        label: "Success",
        use: "A confirmation.",
      },
      {
        token: "color-feedback-warning-default",
        label: "Warning",
        use: "A warning.",
      },
      {
        token: "color-feedback-info-default",
        label: "Information",
        use: "A note or a tip.",
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

/** The radius and shadow roles the guide shows, each with the label of its button and its plain use. */
export const SHAPE_PICKS: Record<
  "radius" | "shadow",
  { token: string; label: string; use: string }[]
> = {
  radius: [
    {
      token: "radius-xs",
      label: "Checkbox",
      use: "A checkbox or a small tag.",
    },
    {
      token: "radius-sm",
      label: "Badge",
      use: "A small element, such as a badge.",
    },
    {
      token: "radius-md",
      label: "Menu row",
      use: "An icon tile or a row in a menu.",
    },
    {
      token: "radius-lg",
      label: "Card",
      use: "A card or a picture frame.",
    },
    {
      token: "radius-xl",
      label: "Large card",
      use: "A large card that stands out.",
    },
    {
      token: "radius-full",
      label: "Button",
      use: "A button, a chip, anything shaped like a pill.",
    },
  ],
  shadow: [
    {
      token: "shadow-none",
      label: "At rest",
      use: "A card nobody is pointing at. It stays flat; its thin border marks its edge.",
    },
    {
      token: "shadow-raised",
      label: "Hover",
      use: "A card under the mouse pointer. It lifts, and does not move or grow.",
    },
    {
      token: "shadow-floating",
      label: "Floating",
      use: "A small badge that floats over a picture or a card, such as a number.",
    },
    {
      token: "shadow-popover",
      label: "Dropdown",
      use: "A menu or a popover that opens over the page.",
    },
    {
      token: "shadow-panel",
      label: "Panel",
      use: "The navigation panel that opens from the top bar.",
    },
  ],
};

/**
 * The dials of the live card: the property, its plain label and the values a button sets.
 * The button with an empty value is the default: it clears the dial. `note` says in plain words what the default gives.
 */
export const DIALS: {
  property: string;
  label: string;
  note?: string;
  values: [label: string, value: string][];
}[] = [
  {
    property: "--ig-size",
    label: "Size",
    note: "A smaller size also tightens the spacing: Medium to 87.5%, Small to 75%.",
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
      ["Normal", ""],
      ["Double", "2"],
    ],
  },
  {
    property: "--ig-radius-factor",
    label: "Roundness",
    note: "Buttons stay fully round and cards are gently rounded.",
    values: [
      ["Square", "0"],
      ["Standard", ""],
      ["Round", "1"],
    ],
  },
  {
    property: "--ig-elevation-factor",
    label: "Shadow",
    values: [
      ["None", "0"],
      ["Normal", ""],
      ["Double", "2"],
    ],
  },
];
