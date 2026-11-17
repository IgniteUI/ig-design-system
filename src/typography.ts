// Compiles the type scale and the type sets with the engine's typography() and shapes them for tokens.json.
import { fluid } from "./fluid.ts";
import { compile } from "./sass.ts";
import {
  ENGINE_TYPE_SLOTS,
  TYPE,
  TYPE_FLUID_RANGE,
  TYPE_MIN,
  TYPE_SETS,
  type TypeSetEntry,
} from "./spec.ts";
import type { TypeGroup, TypeSetStyle, TypeStyle } from "./types.ts";
import { rem } from "./units.ts";

/** The compiled properties of each slot: slot, then property, then value. */
export type TypeScale = Record<string, Record<string, string>>;
type ScaleRow = {
  slot: string;
  size: string;
  weight: number;
  line: number;
  tracking: string;
  transform: string;
};

/** The published role names, in the order of TYPE. */
export const typeRoles = () => TYPE.map((row) => row.name);

/** Throws when TYPE_MIN names something that is not a type role. */
export const assertFluidRoles = (
  typeMin: Record<string, number>,
  roles: string[],
) => {
  for (const name of Object.keys(typeMin))
    if (!roles.includes(name))
      throw new Error(
        `TYPE_MIN names "${name}", which is not a type role. The roles are: ${roles.join(", ")}.`,
      );
};

/** Throws when a type set does not list each role exactly once. */
export const assertTypeSetRoles = (
  set: string,
  entries: Record<string, unknown>,
  roles: string[],
) => {
  const unknown = Object.keys(entries).filter((n) => !roles.includes(n));
  const missing = roles.filter((n) => !entries[n]);
  if (unknown.length || missing.length)
    throw new Error(
      `TYPE_SETS.${set} must list each type role once.${unknown.length ? ` Not a role: ${unknown.join(", ")}.` : ""}${missing.length ? ` Missing: ${missing.join(", ")}.` : ""} The roles are: ${roles.join(", ")}.`,
    );
};

// A type variable the engine's typography() emits: --ig-<slot>-<property>: <value>;
const SLOT_VARIABLE =
  /--ig-([a-z0-9-]+?)-(font-size|font-weight|font-style|line-height|letter-spacing|text-transform): ([^;]+);/g;

/** Reads each slot's properties from a compiled typography() stylesheet. Throws when a slot is absent. */
export const typeScaleOf = (css: string, slots: string[]): TypeScale => {
  const scale: TypeScale = {};
  for (const [, slot, property, value] of css.matchAll(SLOT_VARIABLE)) {
    scale[slot] ??= {};
    scale[slot][property] = value;
  }
  for (const slot of slots)
    if (!scale[slot]) throw new Error(`slot missing in engine output: ${slot}`);
  return scale;
};

const typographySass = (rows: ScaleRow[]) =>
  `@use 'igniteui-theming' as *;\n$scale: (\n${rows.map((r) => `  '${r.slot}': type-style($font-size: ${r.size}, $font-weight: ${r.weight}, $line-height: ${r.line}, $letter-spacing: ${r.tracking}, $text-transform: ${r.transform})`).join(",\n")}\n);\n:root { @include typography('x', $scale); }\n`;

const compiledScale = (rows: ScaleRow[]) =>
  typeScaleOf(
    compile(typographySass(rows)),
    rows.map((r) => r.slot),
  );

/** The default scale. A role in TYPE_MIN gets a fluid size. */
export const defaultTypeScale = (): TypeScale => {
  assertFluidRoles(TYPE_MIN, typeRoles());
  return compiledScale(
    TYPE.map((row) => ({
      slot: row.slot,
      size: TYPE_MIN[row.name]
        ? fluid(
            TYPE_MIN[row.name],
            row.sizePx,
            TYPE_FLUID_RANGE.from,
            TYPE_FLUID_RANGE.to,
          )
        : `rem(${row.sizePx}px)`,
      weight: row.weight,
      line: row.line,
      tracking: row.tracking,
      transform: row.transform,
    })),
  );
};

const typeSetScale = (entries: Record<string, TypeSetEntry>) =>
  compiledScale(
    TYPE.map((row) => {
      const entry = entries[row.name];
      return {
        slot: row.slot,
        size: `rem(${entry.sizePx}px)`,
        weight: entry.weight,
        line: entry.line,
        tracking: entry.tracking ?? "0",
        transform: entry.transform ?? row.transform,
      };
    }),
  );

/** The compiled scale of each set in TYPE_SETS, by set name. */
export const typeSetScales = (): Record<string, TypeScale> => {
  const scales: Record<string, TypeScale> = {};
  for (const [set, entries] of Object.entries(TYPE_SETS)) {
    assertTypeSetRoles(set, entries, typeRoles());
    scales[set] = typeSetScale(entries);
  }
  return scales;
};

/** True when the engine has a slot of this name, so the role reads --ig-<slot>-*. */
export const isEngineSlot = (slot: string) => ENGINE_TYPE_SLOTS.includes(slot);

/** The type styles of tokens.json, in a Display and a Body group. */
export const typeGroups = (scale: TypeScale): TypeGroup[] => {
  const display: TypeGroup = { name: "Display", family: "display", styles: [] };
  const body: TypeGroup = { name: "Body", family: "body", styles: [] };
  for (const row of TYPE) {
    const compiled = scale[row.slot];
    const style: TypeStyle = {
      name: `type-${row.name}`,
      fontSize: rem(row.sizePx),
      ...(TYPE_MIN[row.name] ? { fontSizeMin: rem(TYPE_MIN[row.name]) } : {}),
      lineHeight: compiled["line-height"],
      fontWeight: row.weight,
      usage: isEngineSlot(row.slot)
        ? `${row.usage} Engine slot \`${row.slot}\`.`
        : row.usage,
      sample: row.sample,
    };
    if (row.tracking !== "0") style.letterSpacing = compiled["letter-spacing"];
    const group = row.family === "display" ? display : body;
    // A style whose face differs from its group's names its own.
    if (row.family !== group.family) style.family = row.family;
    group.styles.push(style);
  }
  return [display, body];
};

/** The styles of each type set, as tokens.json lists them. */
export const typeSetStyles = (
  scales: Record<string, TypeScale>,
): Record<string, TypeSetStyle[]> =>
  Object.fromEntries(
    Object.entries(scales).map(([set, scale]) => [
      set,
      TYPE.map((row) => {
        const compiled = scale[row.slot];
        return {
          name: `type-${row.name}`,
          fontSize: compiled["font-size"],
          lineHeight: compiled["line-height"],
          fontWeight: +compiled["font-weight"],
          ...(compiled["letter-spacing"] !== "0"
            ? { letterSpacing: compiled["letter-spacing"] }
            : {}),
          ...(compiled["text-transform"] !== "none"
            ? { textTransform: compiled["text-transform"] }
            : {}),
        };
      }),
    ]),
  );
