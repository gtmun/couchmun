import chroma from 'chroma-js';
import colors from 'tailwindcss/colors';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
/**
 * Palette type. Should have 11 elements (for each of the above shades).
 */
type Palette = chroma.Color[];

/**
 * Gets the palette of a builtin Tailwind color.
 * @param color The name of the color.
 * @returns the palette
 */
function fromTailwind(color: string): Palette {
    let o = (colors as any)[color];
    return SHADES.map(i => o[i]);
}
/**
 * Creates a palette given a set of shades (should go from lightest to darkest).
 * @param scale the set of shades
 * @returns a list of tuples, designating the shade value and its color
 */
function getPalette(...scale: string[]): Palette {
    let scl = chroma.scale(scale);

    return SHADES.map(shade => scl(shade / 1000));
}
/**
 * Computes the contrast color pseudo-palette from the provided palette.
 * @param name the name of the palette
 * @param palette the palette colors
 * @returns a pseudo-palette of the colors.
 */
function getContrastPalette(name: string, palette: Palette) {
    const light = chroma(palette[0] ?? "#FFFFFF");
    const dark = chroma(palette[palette.length - 1] ?? "#000000");

    return palette.map(c => {
        if (chroma.contrast(c, light) <= chroma.contrast(c, dark)) {
            return `var(--color-${name}-contrast-dark)`;
        } else {
            return `var(--color-${name}-contrast-light)`;
        }
    });
}
/**
 * Creates a set of CSS lines which set the assigned color variable (e.g., primary or surface) to the palette.
 * @param name Color variable to assign
 * @param palette Palette to assign
 * @returns CSS lines
 */
function setPalette(name: string, palette: (chroma.Color | string)[]) {
    return palette.map((color, i) => `--color-${name}-${SHADES[i]}: ${typeof color === "string" ? color : color.css('oklab')};`)
        .join("\n");
}
/**
 * Creates a set of CSS lines which set the contrast color variables to the contrasted version of the provided palette.
 * @param name Color variable to assign
 * @param palette Non-contrast palette
 * @returns CSS line
 */
function setContrastPalette(name: string, palette: Palette) {
    return setPalette(`${name}-contrast`, getContrastPalette(name, palette));
}

function parsePalette(palId: string): Palette {
    if (palId === "default-surface") palId = "#666666";

    if (palId.startsWith("tw:")) {
        if (palId.endsWith("-500")) {
            let core = (colors as any)[palId.slice(3, -4)][500];
            return parsePalette(core);
        } else {
            return fromTailwind(palId.slice(3));
        }
    } else if (chroma.valid(palId)) {
        return getPalette("#FFFFFF", palId, "#111111");
    } else {
        return getPalette("#FFFFFF", "#111111");
    }
}
/**
 * @returns a style rule for overriding the base theme styles.
 */
export function genStyles(primary?: string, surface?: string) {
    let surfacePal = parsePalette(surface ?? "#666666");
    let primaryPal = primary && primary != "default-primary" ? parsePalette(primary) : undefined;

    return `html[data-theme='sofa'] {
        ${setPalette('surface', surfacePal)}
        ${setContrastPalette('surface', surfacePal)}
        ${primaryPal ? setPalette('primary', primaryPal) : ""}
        ${primaryPal ? setContrastPalette('primary', primaryPal) : ""}
    }`;
}
