import type { DelegateAttrs } from "$lib/types";

/**
 * All defined presets.
 * 
 * Each preset consists of a key and its properties (label).
 * The preset should be defined at `preset-${key}.json` in this folder.
 */
export const PRESETS = {
    un: { label: "United Nations" },
    custom: { label: "Custom" }
}

/**
 * These keys do not have presets. It really should just be `custom` that doesn't have preset data.
 */
const NO_PRESET: readonly (keyof typeof PRESETS)[] = ["custom"];

/**
 * @returns the default preset key (the first one defined on the object).
 */
export function defaultPresetKey(): keyof typeof PRESETS {
    return (Object.keys(PRESETS) as (keyof typeof PRESETS)[])[0];
}

/**
 * Gets the preset data at a given file key.
 * @param file the preset key (must be a key in `PRESETS`)
 * @returns the preset data (if it exists)
 * @throws if key is not in `PRESETS` or JSON is invalid or doesn't exist
 */
export async function getPreset(key: keyof typeof PRESETS) {
    if (!NO_PRESET.includes(key)) {
        const { default: json } = await import(`$lib/delegate_presets/preset-${key}.json`);
        return structuredClone<Record<string, DelegateAttrs>>(json);
    }
}
