// Gate: padding, margins and gaps in a component use the spacing roles (--igd-space-inset-*, --igd-space-stack-*, --igd-space-gap-*), never a raw step.
// node checks/spacing-roles.ts <dir-or-file> [...]
import fs from "node:fs";
import path from "node:path";
import { isMain } from "../src/main.js";
/** The spacing role a property takes, or null when the property is not a spacing property. */
export const role = (prop) => {
    const p = prop.replace(/-/g, "").toLowerCase();
    if (p.startsWith("padding") || p.endsWith("pad"))
        return "inset";
    if ([
        "gap",
        "columngap",
        "rowgap",
        "marginleft",
        "marginright",
        "margininline",
    ].includes(p))
        return "gap";
    if (p.startsWith("margin"))
        return "stack";
    return null;
};
/** Lists the raw spacing steps used in a spacing property. The property is the nearest name before the var(), within 400 characters. */
export const rawSteps = (text) => {
    const found = [];
    for (const m of text.matchAll(/var\(\s*--igd-space-((?:\d?x[sl]|sm|md|lg))\s*(?:,[^()]*)?\)/g)) {
        const before = text.slice(Math.max(0, m.index - 400), m.index);
        const props = [
            ...before.matchAll(/(?:[{,;]\s*|\b(?:const|let)\s+)([a-zA-Z-]+)\s*[:=](?!=)/g),
        ].map((x) => x[1]);
        const prop = props.at(-1);
        const r = prop ? role(prop) : null;
        if (prop && r)
            found.push({
                prop,
                value: m[0],
                fix: `var(--igd-space-${r}-${m[1]})`,
                index: m.index,
            });
    }
    return found;
};
if (isMain(import.meta.url)) {
    const files = [];
    const walk = (p) => {
        if (fs.statSync(p).isDirectory())
            for (const f of fs.readdirSync(p))
                walk(path.join(p, f));
        else if (/\.(jsx|css)$/.test(p))
            files.push(p);
    };
    for (const p of process.argv.slice(2))
        walk(p);
    let bad = 0;
    for (const f of files) {
        for (const s of rawSteps(fs.readFileSync(f, "utf8"))) {
            bad++;
            console.log(`${f}: ${s.prop} uses ${s.value}; use ${s.fix}`);
        }
    }
    console.log(bad
        ? `spacing roles gate: ${bad} raw step(s) in a spacing property`
        : `spacing roles gate: pass (${files.length} files)`);
    process.exit(bad ? 1 : 0);
}
