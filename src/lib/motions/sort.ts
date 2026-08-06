/**
 * This module implements the infrastructure required to sort motions.
 * 
 * The most important API of this module is `compareMotions`, which is a comparator 
 * (which can be inserted into `Array.sort`) that compares motions.
 * 
 * Using it requires defining a "sort order", which is the priority in which motions are ordered.
 * See the docs for `SortOrder` in `$lib/types` for more details about how sort order is set up.
 */

import type { Motion, MotionKind, SortKind, SortOrder } from "$lib/types";
import { compare, hasKey, type Comparator } from "$lib/util";

export const SORT_KIND_EXTRAS_NAMES: Record<Exclude<SortKind, MotionKind>, string> = {
    ext: "Extension"
};
export const SORT_PROPERTY_NAMES = {
    totalTime: "Total Time",
    speakingTime: "Speaking Time",
    topic: "Topic",
    delegate: "Delegate Key",
    nSpeakers: "Number of Speakers",
    readingPeriodTime: "Reading Period Time",
    authorsPanelTime: "Author's Panel Time",
    qnaTime: "Q&A Time",
} satisfies Record<string, string>;

function getSortKind(m: Motion): SortKind | undefined {
    if (hasKey(m, "isExtension") && m.isExtension) return "ext";
    return m.kind;
}
function getSortIndex(m: Motion, priority: SortOrder): number {
    const kind = getSortKind(m);

    // Find the index of this motion under the priority, putting it at the end if not in the list.
    const index = priority.findIndex((entry) => (entry.kind as (SortKind | undefined)[]).includes(kind));
    return index >= 0 ? index : priority.length;
}

/**
 * Creates a "comparator" for motions, using the provided sort order.
 * 
 * A comparator is a function that "compares" two motions. This can be directly input to 
 * `Array.sort` to sort an array of motions. For example,
 * 
 * ```ts
 * const motions: Motion[] = [ ... ];
 * const comparator = compareMotions(...);
 * 
 * motions.sort(comparator);
 * ```
 * 
 * @param priority the sort order to use.
 * @returns the comparator
 */
export function baseCompareMotions(priority: SortOrder, getSortProperty: (m: Motion, key: string) => unknown): Comparator<Motion> {
    return (a, b) => {
        let k: number;

        // Check indices match:
        const ai = getSortIndex(a, priority);
        const bi = getSortIndex(b, priority);

        k = compare(ai, bi);
        if (k) return k;
        
        // Run through the order until we find a difference:
        const order = priority[ai ?? bi]?.order;
        if (typeof order !== "undefined") {
            for (const { property, ascending } of order) {
                const av = getSortProperty(a, property);
                const bv = getSortProperty(b, property);
    
                k = compare(av, bv, !ascending);
                if (k) return k;
            }
        }

        return 0;
    }
}