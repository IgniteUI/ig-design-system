interface IgOklch {
    l: number;
    c: number;
    h: number;
}
interface IgFittedOklch extends IgOklch {
    fitted: boolean;
}
type IgSeedFamily = "brand" | "secondary";
interface IgSeedContrast {
    label: number;
    text: number;
    page: number;
    labelOk: boolean;
    textOk: boolean;
    pageOk: boolean;
}
interface IgSeedApi {
    DEFAULT: string;
    SECONDARY: string;
    /** Moves a seed family on `el` (default: the root, family `brand`). An `l, c, h` seed outside sRGB is fitted first. */
    setSeed(seed: string | IgOklch, el?: HTMLElement, family?: IgSeedFamily): IgOklch | IgFittedOklch;
    setSecondary(seed: string | IgOklch, el?: HTMLElement): IgOklch | IgFittedOklch;
    /** Puts one family back to the engine's value, or every family when none is named. */
    resetSeed(el?: HTMLElement, family?: IgSeedFamily): void;
    toOklch(hex: string): IgOklch;
    inGamut(o: IgOklch): boolean;
    /** Lowers chroma until the colour is inside sRGB; lightness and hue are kept. */
    fit(o: IgOklch): IgFittedOklch;
    /** Measures the AA pairings a seed touches on the current page. */
    contrast(): IgSeedContrast;
    rgb(c: string): number[];
}
declare var IgSeed: IgSeedApi;
