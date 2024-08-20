import { DEFAULT_SORT_PRIORITY } from "$lib/dashboard/points-motions/definitions";
import type { AccessibleSettings, Settings } from "$lib/dashboard/types";
import DEFAULT_DELEGATES from '$lib/delegate_presets/un_delegates.json';
import { getContext, setContext } from "svelte";
import { persisted } from "svelte-persisted-store";
import { derived, readonly, type Writable } from "svelte/store";

export const SETTINGS_KEY = "settings";

// Do not access this object to access the fields, cause mutations will affect the defaults.
// Always try to access it through the getDefaults function (which clones this object and can be mutated
// without changing the defaults).
const SETTINGS_DEFAULTS: { [P in keyof Settings]: Settings[P] extends Writable<infer S> ? S : never } = {
    delegateAttributes: DEFAULT_DELEGATES,
    sortOrder: DEFAULT_SORT_PRIORITY,
    delegatesEnabled: Object.fromEntries(
        Object.keys(DEFAULT_DELEGATES).map(k => [k, true])
    ),
    title: "General Assembly",
    preferences: {
        enableMotionRoundRobin: true,
        enableMotionExt: true,
        pauseMainTimer: true,
    }
};
/**
 * @returns a deep copy of the default settings
 */
export const getDefaults = () => structuredClone(SETTINGS_DEFAULTS);

export function createSettingsContext(): Settings {
    // Add writable to all settings:
    const context = Object.fromEntries(Object.entries(getDefaults()).map(
        ([k, v]) => [k, persisted(`${SETTINGS_KEY}.${k}`, v)]
    )) as unknown as Settings;

    return setContext<Settings>(SETTINGS_KEY, context);
}
export function resetSettingsContext(settings: Settings) {
    const defaults: Record<string, unknown> = getDefaults();
    for (let k of Object.keys(settings)) {
        (settings as Record<string, Writable<unknown>>)[k].set(defaults[k]);
    }
}

export function createAccessibleSettings(): AccessibleSettings {
    const settings = getContext<Settings>(SETTINGS_KEY);
    return {
        delegateAttributes: derived([settings.delegateAttributes, settings.delegatesEnabled], 
            ([$attrs, $enables]) => Object.fromEntries(Object.entries($attrs).filter(([k]) => $enables[k] ?? false))
        ),
        sortOrder: readonly(settings.sortOrder),
        title: settings.title
    };
}