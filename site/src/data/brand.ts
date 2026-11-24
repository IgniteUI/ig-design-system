// What the brand book says beyond the logo: the name, a logo beside a partner's, and the sections still to be written.

/** How the company name is written in text, with a right and a wrong example for each rule. */
export const NAME_RULES: { rule: string; right: string; wrong: string }[] = [
  {
    rule: "One word, with a capital I and the rest in lower case.",
    right: "Infragistics",
    wrong: "InfraGistics, Infra Gistics",
  },
  {
    rule: "Typed with a capital I, never in capitals. Only the wordmark spells it in capitals; a label style that shows all its text in capitals may show the name that way.",
    right: "Built by Infragistics",
    wrong: "Built by INFRAGISTICS",
  },
  {
    rule: "The full name in public text. Never shorten or translate it.",
    right: "Infragistics",
    wrong: "Infra",
  },
  {
    rule: "The legal name where a company is meant in law: a copyright line, a contract, a licence.",
    right: "Infragistics, Inc.",
    wrong: "Infragistics Inc, Infragistics Corp.",
  },
];

/** The rules for the Infragistics logo beside the logo of a partner, a customer or an event. */
export const COBRAND_RULES: { title: string; html: string }[] = [
  {
    title: "Who goes first",
    html: "The owner of the material puts its logo first, on the left or on top. On a partner's material, follow the partner's brand book.",
  },
  {
    title: "The same size",
    html: "Set the two logos so neither looks larger. Match the height of the letters, not the height of the files.",
  },
  {
    title: "A rule between them",
    html: "A thin vertical rule separates the logos. Each logo keeps its clear space, so the gap on each side of the rule is at least half the height of the Infragistics logo.",
  },
  {
    title: "Both read on the surface",
    html: "Use one plain surface for both. On a dark surface, use the logo for dark surfaces and the partner's version for dark surfaces.",
  },
  {
    title: "Their files, their permission",
    html: "Get the partner's logo file and approval from the partner. Never redraw, recolour or crop it.",
  },
  {
    title: "Two logos, not one",
    html: "Never join the two into one shape, share a letter between them or set them in one colour.",
  },
];

/** A section the brand book will hold: its anchor, its title, and what it is expected to contain. */
export type SoonSection = { id: string; title: string; expected: string };

/** The sections that wait for content from marketing, legal or design, in page order and by where they go. */
export const SOON = {
  foundation: [
    {
      id: "who-we-are",
      title: "Who we are",
      expected:
        "What Infragistics does, for whom, and why: the mission, the values, the audience and the personality of the brand, in a few sentences each. Every other rule in the brand book follows from it.",
    },
    {
      id: "voice",
      title: "Voice and tone",
      expected:
        "How Infragistics writes. The voice is the same everywhere; the tone changes with the moment, such as a launch, an error message or a support reply. Each trait comes with a sentence that has it and one that does not.",
    },
    {
      id: "trademarks",
      title: "Trademarks",
      expected:
        "Which Infragistics names are registered, when to add ® or ™, and the trademark line for the end of a document. Also what others may not do with the name and the logo, such as use them in their own company, product or domain name, and whom to ask for permission.",
    },
  ],
  visual: [
    {
      id: "brand-colours",
      title: "Brand colours",
      expected:
        "The colours Infragistics uses in marketing, events and print, beyond the colours of the logo and of the website: which colour leads, which colours support it, and the share of each on a page.",
    },
    {
      id: "imagery",
      title: "Imagery",
      expected:
        "The style of photos and of product screenshots: what they show, how they are cropped and edited, and pictures that fit and do not fit.",
    },
    {
      id: "graphics",
      title: "Graphic elements",
      expected:
        "The shapes, patterns, gradients and illustrations that make a page read as Infragistics, with the files and where each one is used.",
    },
    {
      id: "icons",
      title: "Icons",
      expected:
        "The icon set Infragistics uses, its line weight and sizes, its colours, and how an icon sits beside text.",
    },
    {
      id: "motion",
      title: "Motion",
      expected:
        "How the brand moves in video and animation: the logo reveal, the speed and easing of a transition, and what happens when a viewer asks for reduced motion.",
    },
  ],
  use: [
    {
      id: "in-use",
      title: "In use",
      expected:
        "Finished examples of the rules together: a web page, a social card, an email, a slide, an event booth and merchandise.",
    },
    {
      id: "templates",
      title: "Templates",
      expected:
        "Files to start from: a slide deck, an email signature, social avatars and covers, a document, and all logo files in one download.",
    },
    {
      id: "contact",
      title: "Questions and approvals",
      expected:
        "Who owns the brand, whom to ask for a review before something is published, how long a review takes, and a list of changes to this brand book with their dates.",
    },
  ],
} satisfies Record<string, SoonSection[]>;
