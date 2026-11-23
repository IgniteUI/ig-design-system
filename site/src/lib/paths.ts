// Builds links that work under the base path the site is published at.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** The URL of a page or file of the site, from its path from the site root, such as "tokens/" or "llms.txt". */
export const href = (path = "") => `${BASE}/${path.replace(/^\//, "")}`;
