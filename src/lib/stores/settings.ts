import { DEFAULT_SORT_PRIORITY } from "$lib/dashboard/points-motions/definitions";
import type { AccessibleSettings, Settings } from "$lib/dashboard/types";
import DEFAULT_DELEGATES from '$lib/delegate_presets/un_delegates.json';
import { derived, readonly } from "svelte/store";
import { createStore } from ".";

const { getDefaults, createContext, resetContext, getStoreContext } = createStore<Settings>("settings", 
    {
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
    }, 
    () => ({}), 
    () => ({})
);

export {
    getDefaults,
    createContext as createSettingsContext,
    resetContext as resetSettingsContext,
    getStoreContext as getSettingsContext
};

export function createAccessibleSettings(): AccessibleSettings {
    const settings = getStoreContext();
    return {
        delegateAttributes: derived([settings.delegateAttributes, settings.delegatesEnabled], 
            ([$attrs, $enables]) => Object.fromEntries(Object.entries($attrs).filter(([k]) => $enables[k] ?? false))
        ),
        sortOrder: readonly(settings.sortOrder),
        title: settings.title
    };
}