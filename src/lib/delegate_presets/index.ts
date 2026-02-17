/**
 * This module provides helpers for managing presets of delegate rosters.
 * 
 * For example, the United Nations roster (consisting of all United Nations member states)
 * is a frequently used roster, so it is provided for convenience!
 */

import DEFAULT_DELEGATES_JSON from "$lib/delegate_presets/preset-un.json";
import type { DelegateAttrs } from "$lib/types";
import { hasKey } from "$lib/util";

type DelProperties = Record<string, DelegateAttrs>;
/**
 * The object of default delegates.
 */
export const DEFAULT_DELEGATES: DelProperties = DEFAULT_DELEGATES_JSON;
/**
 * The key of the default preset.
 */
export const DEFAULT_PRESET_KEY = "un";

/**
 * All defined presets.
 * 
 * Each preset consists of a key and its properties (label).
 * The preset should be defined at `preset-${key}.json` in this folder.
 */
export const PRESETS = {
    un: { label: "United Nations" }
}

function hasPreset(key: string): key is keyof typeof PRESETS {
    return hasKey(PRESETS, key);
}
/**
 * Gets the preset data at a given file key.
 * @param file the preset key (must be a key in `PRESETS`)
 * @returns the preset data (if it exists)
 * @throws if key is not in `PRESETS` or JSON is invalid or doesn't exist
 */
export async function getPreset(key: keyof typeof PRESETS): Promise<DelProperties>;
export async function getPreset(key: string): Promise<DelProperties | undefined>;
export async function getPreset(key: string): Promise<DelProperties | undefined> {
    if (hasPreset(key)) {
        const { default: json } = await import(`$lib/delegate_presets/preset-${key}.json`);
        return structuredClone(json);
    }
}
