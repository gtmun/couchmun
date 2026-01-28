import { untrack } from "svelte";

/**
 * If any of the specified signals update, then run the effect.
 * 
 * This is an `$effect`.
 * @param signals The signals.
 * @param effect The side effects.
 */
export function watchEffect<T>(signals: () => T, effect: (t: T) => void) {
    $effect(() => {
        const s = signals();
        untrack(() => effect(s));
    })
}

/**
 * Clones the object, creating a proxified version which reacts to any internal updates
 * (this is one of the effects of `$state(...)` on an object).
 * 
 * This function works around two issues with Svelte's runes:
 * 1. `$state(...)` cannot be used outside of variable declarations (even though the proxifying effect does not require it)
 * 2. Edits to `$state(t)` (or `$derived(t)`) for some state `t` propagate back to `t`.
 * 
 * ## Deeply-reactive `$derived`s
 * 
 * This function is particularly useful for enabling deeply-reactive `$derived`s,
 *     which are `$derived` state which can be temporarily mutated and which internal changes can be observed.
 * Such a variable can be constructed as `let st = $derived(proxify(...))`.
 */
export function proxify<T extends object>(t: T) {
    const st = $state($state.snapshot(t));
    return st;
}