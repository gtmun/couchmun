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
 * Equivalent to `$state(t)` (taking the effect of converting the object into a proxy),
 * but without necessarily needing `$state(...)` to be a variable initializer.
 * 
 * This function may become unnecessary if `$state(...)` is allowed outside of variable initializers.
 * 
 * ## Deeply-reactive `$derived`s
 * 
 * This function is particularly useful for enabling deeply-reactive `$derived`s,
 *     which are `$derived` state based on other state whose internal changes can be observed.
 * Such a variable can be constructed as `let st = $derived(proxify(...))`.
 */
export function proxify<T extends object>(t: T) {
    const st = $state(t);
    return st;
}