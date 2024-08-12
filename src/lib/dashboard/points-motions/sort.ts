import type { Motion, SKeyUnit, SortEntry, SortOrderKey } from "../types";

type Comparator<K> = (a: K, b: K) => number;

/**
 * Converts a string or string array into just an array.
 */
const asArray = <T>(t: T | T[]) => t instanceof Array ? t : [t];
const divideKey = (key: SortOrderKey): [key: SKeyUnit, asc: boolean] => {
    return key.endsWith(" asc") ? [key.slice(0, -4) as SKeyUnit, true] : [key as SKeyUnit, false];
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

function computeProperty(m: Motion, key: SortOrderKey): number {
    let [unit, asc] = divideKey(key);

    // Invert sort order if ascending:
    if (asc) return -computeProperty(m, unit);
    // If key present in motion, use it:
    if (unit in m) return +(m as any)[unit];
    // If key == 'nSpeakers', use n. speakers algo:
    if (unit === "nSpeakers" && "totalTime" in m && "speakingTime" in m) return m.totalTime / (m as any).speakingTime;
    // Give up:
    return Infinity;
}
function asSortKey(m: Motion, priority: SortEntry[]) {
    let index = priority.findIndex(({ kind }) => asArray(kind).includes(m.kind));
    if (index < 0) return [priority.length];
    let { order } = priority[index];

    return [index, ...asArray(order).map(key => computeProperty(m, key))];
}

export function compareMotions(priority: SortEntry[]): Comparator<Motion> {
    return (a, b) => lexico(asSortKey(a, priority), asSortKey(b, priority));
}