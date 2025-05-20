// TODO: Integrate with Dexie in a way that doesn't cause FOUC

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

export function initThemeState(theme: Theme) {
    for (let key of Object.keys(THEME_DEFAULTS)) {
        let store = localStorage.getItem(`theme.${key}`);
        if (store) {
            (theme as any)[key] = store;
        }
    }

    $effect(() => {
        localStorage.setItem("theme.colorScheme", theme.colorScheme);
    })
    $effect(() => {
        localStorage.setItem("theme.primaryShade", theme.primaryShade);
    })
    $effect(() => {
        localStorage.setItem("theme.surfaceShade", theme.surfaceShade);
    })
}
