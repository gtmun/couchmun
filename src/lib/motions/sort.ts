/**
 * This module implements the infrastructure required to sort motions.
 * 
 * The most important API of this module is `compareMotions`, which is a comparator 
 * (which can be inserted into `Array.sort`) that compares motions.
 * 
 * Using it requires defining a "sort order", which is the priority in which motions are ordered.
 * See the docs for `SortOrder` in `$lib/types` for more details about how sort order is set up.
 */

import type { Motion, SortKind, SortOrder, SortOrderProperty } from "$lib/types";
import { compare, hasKey, type Comparator } from "$lib/util";

export const SORT_KIND_NAMES: Record<SortKind, string> = {
    mod: "Moderated Caucus",
    unmod: "Unmoderated Caucus",
    rr: "Round Robin",
    other: "Other",
    ext: "Extension"
};
export const SORT_PROPERTY_NAMES: Record<SortOrderProperty, string> = {
    totalTime: "total time",
    speakingTime: "speaking time",
    topic: "topic",
    delegate: "delegate key",
    nSpeakers: "number of speakers"
};

type AllKeys<O> = O extends object ? keyof O : never;
const SORT_PROPERTY_REQUIRES = {
    totalTime:    ["totalTime"],
    speakingTime: ["speakingTime"],
    topic:        ["topic"],
    delegate:     ["delegate"],
    nSpeakers:    ["totalTime", "speakingTime"],
} as const satisfies Record<SortOrderProperty, readonly AllKeys<Motion>[]>;

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

function hasSortProperty<P extends SortOrderProperty>(m: object, key: P): m is Record<typeof SORT_PROPERTY_REQUIRES[P][number], unknown> {
    return SORT_PROPERTY_REQUIRES[key].every(f => hasKey(m, f));
}
function getSortProperty(m: Motion, key: SortOrderProperty): unknown {
    if (key === "delegate") {
        if (hasSortProperty(m, key)) return m.delegate;
    } else if (key === "nSpeakers") {
        if (m.kind === "rr") return m.totalSpeakers;
        if (hasSortProperty(m, key)) return m.totalTime / m.speakingTime;
    } else if (key === "speakingTime") {
        if (hasSortProperty(m, key)) return m.speakingTime;
    } else if (key === "topic") {
        if (hasSortProperty(m, key)) return m.topic;
    } else if (key === "totalTime") {
        if (m.kind === "rr") return m.totalSpeakers * m.speakingTime;
        if (hasSortProperty(m, key)) return m.totalTime;
    } else {
        key satisfies never;
    }

    throw Error(`Motion cannot be sorted by ${key}`);
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
export function compareMotions(priority: SortOrder): Comparator<Motion> {
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