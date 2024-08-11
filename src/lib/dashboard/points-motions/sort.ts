import type { Motion, MotionKind } from "../types";

type Comparator<K> = (a: K, b: K) => number;

// Bunch of types to define SortEntry
type OneOrMany<T> = T | T[];
type AllKeys<T> = T extends {} ? keyof T : never;
type SOKeyUnit = Exclude<AllKeys<Motion> | "nSpeakers", "kind">;
type SortOrderKey = SOKeyUnit | `${SOKeyUnit} asc`;
type SortEntry = {
    kind: OneOrMany<MotionKind>,
    order: OneOrMany<SortOrderKey>
};

/**
 * The established sort order.
 * Values first in the list are prioritized, with the order parameter handling ties.
 */
const SORT_PRIORITY: SortEntry[] = [
    { kind: "unmod", order: ["totalTime asc"] },
    { kind: "mod", order: ["totalTime asc", "nSpeakers asc"] }
];

/**
 * Converts a string or string array into just a string.
 */
const asArray = <T>(t: OneOrMany<T>) => t instanceof Array ? t : [t];
const divideKey = (key: SortOrderKey): [key: SOKeyUnit, asc: boolean] => {
    return key.endsWith(" asc") ? [key.slice(0, -4) as SOKeyUnit, true] : [key as SOKeyUnit, false];
}
/**
 * Lexicographical compare of arrays.
 */
const lexico: Comparator<(number | string)[]> = (a, b) => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    return a.length - b.length;
};

function asSortKey(k: Motion, priority = SORT_PRIORITY) {
    let index = priority.findIndex(({ kind }) => asArray(kind).includes(k.kind));
    if (index < 0) return [priority.length];
    let { order } = priority[index];

    return [index,
        ...asArray(order).map(key => {
            let [unit, asc] = divideKey(key);
            let factor = asc ? -1 : 1;

            if (unit in k) {
                // Try to use a key that exists:
                return factor * +(k as any)[unit];
            } else if (unit === "nSpeakers" && "totalTime" in k && "speakingTime" in k) {
                // Try to use number of speakers:
                return factor * (k.totalTime / (k as any).speakingTime);
            } else {
                // Couldn't find a key that matches, so just return the highest possible value (move it to the end).
                return Infinity;
            }
        })
    ];
}


export const compareMotions: Comparator<Motion> = (a, b) => lexico(asSortKey(a), asSortKey(b));