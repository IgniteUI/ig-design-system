// A Sätteri plugin for the Markdown documents the site publishes as pages. It links the documents to each other as pages,
// gives a code sample a copy button, and makes a table of names filterable, copyable and stackable on a narrow page.
import { defineHastPlugin } from "satteri";

const el = (tagName, properties, children = []) => ({ type: "element", tagName, properties, children });
const is = (node, ...names) => node?.type === "element" && names.includes(node.tagName);
const elements = (node) => node.children.filter((child) => child.type === "element");

// The copy mark of the site's CopyName component.
const COPY_MARK = el("svg", { viewBox: "0 0 16 16", ariaHidden: "true" }, [
  el("rect", { x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5" }),
  el("path", { d: "M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" }),
]);

// A name of the design system as it is written in CSS: a custom property or a type class.
const PUBLISHED = /^(--igd?-[\w-]+|\.igd-[\w-]+)$/;
// Any name that must not break in the middle: a custom property, a class, or a pattern of them.
const NAME = /^(--|\.igd-)[\w-]+\*?$/;

/**
 * @param {{ documents: readonly { file: string; slug: string }[]; base: string }} options
 * `documents` are the Markdown files published as pages; `base` is the base path of the site, with a slash at each end.
 */
export const documentMarkdown = ({ documents, base }) => {
  const pages = new Map(documents.map((d) => [d.file.split("/").pop(), `${base}${d.slug}/`]));

  return defineHastPlugin({
    name: "document-markdown",
    element: [
      {
        // A link to another document goes to its page.
        filter: ["a"],
        visit(node, ctx) {
          const [target, hash] = String(node.properties.href ?? "").split("#");
          if (/^[a-z]+:/i.test(target) || !target.endsWith(".md")) return;
          const page = pages.get(target.split("/").pop());
          if (!page)
            throw new Error(
              `${ctx.fileURL?.pathname ?? "A document"} links to ${target}, which is not a page of the site. Link to a document listed in DOCUMENTS in site/src/data/navigation.ts, or to a web address.`,
            );
          ctx.setProperty(node, "href", hash ? `${page}#${hash}` : page);
        },
      },
      {
        // A code sample gets a frame and a button that copies it.
        filter: ["pre"],
        visit(node, ctx) {
          ctx.setProperty(node, "role", "region");
          ctx.setProperty(node, "ariaLabel", "Code sample");
          ctx.wrapNode(
            node,
            el("div", { className: ["code"], dataOnDark: "" }, [
              el(
                "button",
                {
                  type: "button",
                  dataCopy: ctx.textContent(node).trimEnd(),
                  dataCopyLabel: "the code",
                  ariaLabel: "Copy the code",
                },
                [{ type: "text", value: "Copy" }],
              ),
            ]),
          );
        },
      },
      {
        filter: ["code"],
        visit(node, ctx) {
          const parent = ctx.parent(node);
          if (is(parent, "pre")) return;
          const name = ctx.textContent(node);
          if (NAME.test(name)) ctx.setProperty(node, "className", ["name"]);
          // A published name in a table is a button that copies it: var(--name) for CSS, the bare name with Alt.
          // The first column holds the old name, which nobody copies.
          if (!is(parent, "td") || !PUBLISHED.test(name)) return;
          const first = ctx.parent(parent).children.findIndex((cell) => cell.type === "element");
          if (ctx.indexOf(parent) === first) return;
          const copy = name.startsWith("--") ? `var(${name})` : name.replace(/^\./, "");
          ctx.wrapNode(
            node,
            el(
              "button",
              { type: "button", className: ["copy-name"], dataCopy: copy, dataCopyAlt: name, ariaLabel: `Copy ${copy}` },
              [COPY_MARK],
            ),
          );
        },
      },
      {
        // The roles keep a table a table for assistive technology when a narrow page stacks its rows.
        filter: ["table", "thead", "tbody", "tr", "th", "td"],
        visit(node, ctx) {
          const role = { table: "table", thead: "rowgroup", tbody: "rowgroup", tr: "row", th: "columnheader", td: "cell" };
          ctx.setProperty(node, "role", role[node.tagName]);
          const parent = ctx.parent(node);
          // A row is found by any text in it, old name or new.
          if (is(node, "tr") && is(parent, "tbody"))
            ctx.setProperty(node, "dataToken", ctx.textContent(node).replace(/\s+/g, " ").trim());
          // A cell carries the name of its column, shown beside it when the rows are stacked.
          if (is(node, "td")) {
            const table = ctx.parent(ctx.parent(parent));
            const head = table.children.find((child) => is(child, "thead"));
            const title = head && elements(head)[0]?.children[ctx.indexOf(node)];
            if (title) ctx.setProperty(node, "dataLabel", ctx.textContent(title));
          }
        },
      },
    ],
    // A heading and what follows it, up to the next heading, form one group when they hold a table: the filter hides the group when no row is left.
    after(root, ctx) {
      const groups = [];
      for (const node of root.children) {
        if (is(node, "h1", "h2", "h3") || !groups.length) groups.push([]);
        groups.at(-1).push(node);
      }
      for (const group of groups) {
        const [first, ...rest] = group;
        if (!group.some((node) => is(node, "table"))) continue;
        for (const node of rest) ctx.removeNode(node);
        ctx.replaceNode(first, el("section", { dataFilterGroup: "" }, group));
      }
    },
  });
};
