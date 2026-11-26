// What a site does to use the package: the stylesheets in load order, the dials and the two commands. The guide and llms.txt print these.

/** The stylesheets of the package, in the order a site loads them. */
export const STYLESHEETS = [
  {
    file: "fonts.css",
    optional: true,
    note: "The three faces. Leave it out when the site already loads Plus Jakarta Sans, DM Sans and JetBrains Mono.",
  },
  {
    file: "tokens.css",
    optional: false,
    note: "every token with its default value.",
  },
  {
    file: "theme.css",
    optional: false,
    note: "the live layer: dials, derived state colours, the dark variant, type roles.",
  },
  {
    file: "base.css",
    optional: true,
    note: "Element styles for a site that has none.",
  },
] as const;

/** The dials a site sets on the page or on a `data-ig-scope` element. They are the engine's; the package leaves them unset. */
export const DIALS = [
  "--ig-size",
  "--ig-spacing",
  "--ig-radius-factor",
  "--ig-elevation-factor",
] as const;

/** The command that installs the package. */
export const installCommand = (pkg: string) => `npm install ${pkg}`;

/** The command that checks a site's source. */
export const checkCommand = (pkg: string) => `npx ${pkg} check src`;
