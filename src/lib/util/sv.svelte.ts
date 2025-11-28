import { untrack } from "svelte";

/**
 * If any of the specified signals update, then run the effect.
 * 
 * This is an `$effect`.
 * @param signals The signals.
 * @param effect The side effects.
 */
export function watch<T>(signals: () => T, effect: (t: T) => void) {
    $effect(() => {
        const s = signals();
        untrack(() => effect(s));
    })
}