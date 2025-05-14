import chroma from 'chroma-js';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Creates a palette given a set of shades (should go from lightest to darkest).
 * @param scale the set of shades
 * @returns a list of tuples, designating the shade value and its color
 */
export function getPalette(scale: string[]) {
    let scl = chroma.scale(scale);

    return SHADES.map(shade => [shade, scl(shade / 1000)] as const);
}

/**
 * @returns a style rule for overriding the base theme styles.
 */
export function genStyles() {
    let pal = getPalette(["#FFFFFF", "#666666", "#111111"]);
    return `html[data-theme='sofa'] {${
        pal.map(([shade, color]) => {
            return `--color-surface-${shade}: ${color.css("oklab")};`
        }).join("\n")
    }}`;
}