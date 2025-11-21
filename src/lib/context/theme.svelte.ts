// TODO: Integrate with Dexie in a way that doesn't cause FOUC

import { onMount } from "svelte";
import { readonly, writable, type Writable } from "svelte/store";

export interface Theme {
    colorScheme: "light" | "dark",
    primaryShade: string,
    surfaceShade: string
}

export const THEME_DEFAULTS = {
    colorScheme: "light",
    primaryShade: "default-primary",
    surfaceShade: "default-surface"
} satisfies Theme;

function saveToStorage(storage: Storage, theme: Theme) {
    for (const [key, val] of Object.entries(theme)) {
        storage.setItem(`theme.${key}`, val);
    }
}
export function initThemeState(): Writable<Theme> & { onstorage: (e: StorageEvent) => void } {
    const theme = writable(structuredClone(THEME_DEFAULTS));
    onMount(() => {
        theme.update(($t: any) => {
            for (const key of Object.keys($t)) {
                const store = localStorage.getItem(`theme.${key}`);
                if (store) {
                    $t[key] = store;
                }
            }

            return $t;
        });
    });

    // Create writable which has custom set/update.
    const set: typeof theme["set"] = newTheme => {
        theme.set(newTheme);
        saveToStorage(localStorage, newTheme);
    };
    const update: typeof theme["update"] = updater => theme.update($t => {
        const newTheme = updater($t);
        saveToStorage(localStorage, newTheme);
        return newTheme;
    });
    const onstorage = (e: StorageEvent) => {
        if (e.key?.startsWith("theme.")) {
            const key = e.key.slice(6);
            const val = e.newValue ?? (THEME_DEFAULTS as any)[key];

            theme.update(($t: any) => {
                $t[key] = val;
                return $t;
            });
        }
    };

    return Object.assign(readonly(theme), { set, update, onstorage });
}
