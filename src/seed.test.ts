import { describe, expect, it } from "vitest";
import "./seed.ts";

/** Records the custom properties set on it, in place of an element. */
const fakeElement = () => {
  const props = new Map<string, string>();
  const el = {
    style: {
      setProperty: (k: string, v: string) => props.set(k, v),
      removeProperty: (k: string) => props.delete(k),
    },
  } as unknown as HTMLElement;
  return { el, props };
};

describe("IgSeed.toOklch", () => {
  it("converts the default seed to its OKLCH coordinates", () => {
    const o = IgSeed.toOklch("#155dfc");
    expect(o.l).toBeCloseTo(0.547, 3);
    expect(o.c).toBeCloseTo(0.246, 3);
    expect(o.h).toBeCloseTo(262.9, 1);
  });

  it("gives white a lightness of 1 and no chroma", () => {
    const o = IgSeed.toOklch("#ffffff");
    expect(o.l).toBeCloseTo(1, 4);
    expect(o.c).toBeCloseTo(0, 4);
  });
});

describe("IgSeed.inGamut", () => {
  it("accepts a colour converted from sRGB", () => {
    expect(IgSeed.inGamut(IgSeed.toOklch("#0f9d58"))).toBe(true);
  });

  it("rejects a chroma no sRGB screen can show", () => {
    expect(IgSeed.inGamut({ l: 0.7, c: 0.4, h: 140 })).toBe(false);
  });
});

describe("IgSeed.fit", () => {
  it("returns an in-gamut colour unchanged and not fitted", () => {
    const o = { l: 0.6, c: 0.1, h: 150 };
    expect(IgSeed.fit(o)).toEqual({ ...o, fitted: false });
  });

  it("lowers the chroma of an out-of-gamut colour and keeps lightness and hue", () => {
    const f = IgSeed.fit({ l: 0.7, c: 0.4, h: 140 });
    expect(f.fitted).toBe(true);
    expect(f.l).toBe(0.7);
    expect(f.h).toBe(140);
    expect(f.c).toBeLessThan(0.4);
    expect(IgSeed.inGamut(f)).toBe(true);
  });

  it("stops at the gamut edge: a slightly higher chroma is out of gamut", () => {
    const f = IgSeed.fit({ l: 0.7, c: 0.4, h: 140 });
    expect(IgSeed.inGamut({ ...f, c: f.c + 0.001 })).toBe(false);
  });
});

describe("IgSeed.setSeed", () => {
  it("writes neutral knobs for the default seed", () => {
    const { el, props } = fakeElement();
    IgSeed.setSeed(IgSeed.DEFAULT, el);
    expect(Object.fromEntries(props)).toEqual({
      "--brand-dl": "0.000000",
      "--brand-kc": "1.000000",
      "--brand-dh": "0.0000",
    });
  });

  it("writes the lightness, chroma and hue deltas from the default seed", () => {
    const { el, props } = fakeElement();
    const o = IgSeed.setSeed("#0f9d58", el);
    const d = IgSeed.toOklch(IgSeed.DEFAULT);
    expect(props.get("--brand-dl")).toBe((o.l - d.l).toFixed(6));
    expect(props.get("--brand-kc")).toBe((o.c / d.c).toFixed(6));
    expect(props.get("--brand-dh")).toBe((o.h - d.h).toFixed(4));
  });

  it("fits a seed given as l, c, h before writing it", () => {
    const { el } = fakeElement();
    const o = IgSeed.setSeed({ l: 0.7, c: 0.4, h: 140 }, el);
    expect(o).toMatchObject({ fitted: true });
    expect(o.c).toBeLessThan(0.4);
  });
});

describe("IgSeed.setSecondary and resetSeed", () => {
  it("writes the secondary knobs and leaves the brand knobs unset", () => {
    const { el, props } = fakeElement();
    IgSeed.setSecondary("#ff0088", el);
    expect([...props.keys()]).toEqual([
      "--secondary-dl",
      "--secondary-kc",
      "--secondary-dh",
    ]);
  });

  it("removes one family when it is named", () => {
    const { el, props } = fakeElement();
    IgSeed.setSeed("#0f9d58", el);
    IgSeed.setSecondary("#ff0088", el);
    IgSeed.resetSeed(el, "brand");
    expect([...props.keys()]).toEqual([
      "--secondary-dl",
      "--secondary-kc",
      "--secondary-dh",
    ]);
  });

  it("removes every family when none is named", () => {
    const { el, props } = fakeElement();
    IgSeed.setSeed("#0f9d58", el);
    IgSeed.setSecondary("#ff0088", el);
    IgSeed.resetSeed(el);
    expect(props.size).toBe(0);
  });
});
