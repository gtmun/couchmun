import { DEFAULT_SORT_PRIORITY } from "$lib/motions/definitions";
import type { AccessibleSettings, Settings } from "$lib/types";
import { derived, readonly } from "svelte/store";
import { createStore } from ".";

const { getDefaults, createContext, resetContext, getStoreContext } = createStore<Settings>("settings", 
    {
        sortOrder: DEFAULT_SORT_PRIORITY,
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

/**
 * Creates an object which holds a view of the settings.
 * 
 * This is created so that settings can be accessed using the session data store
 * whilst preventing accidental modifications to the settings
 * and simplifying unimportant details for the session.
 */
export function createAccessibleSettings(): AccessibleSettings {
    const settings = getStoreContext();
    return {
        sortOrder: readonly(settings.sortOrder),
        title: settings.title
    };
}