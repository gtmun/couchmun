import type { Motion, SortEntry, SortKind, SortOrderProperty } from "$lib/types";
import { compare, type Comparator } from "$lib/util";

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

type AllKeys<O> = O extends {} ? keyof O : never;
const SORT_PROPERTY_REQUIRES = {
    totalTime:    ["totalTime"],
    speakingTime: ["speakingTime"],
    topic:        ["topic"],
    delegate:     ["delegate"],
    nSpeakers:    ["totalTime", "speakingTime"],
} as const satisfies Record<SortOrderProperty, readonly AllKeys<Motion>[]>;

function getSortKind(m: Motion): SortKind | undefined {
    if ("isExtension" in m && m.isExtension) return "ext";
    return m.kind;
}
function getSortIndex(m: Motion, priority: SortEntry[]): number {
    let kind = getSortKind(m);

    // Find the index of this motion under the priority, putting it at the end if not in the list.
    const index = priority.findIndex((entry) => (entry.kind as (SortKind | undefined)[]).includes(kind));
    return index >= 0 ? index : priority.length;
}

function hasSortProperty<P extends SortOrderProperty>(m: {}, key: P): m is Record<typeof SORT_PROPERTY_REQUIRES[P][number], unknown> {
    return SORT_PROPERTY_REQUIRES[key].every(f => f in m);
}
function getSortProperty(m: Motion, key: SortOrderProperty): unknown {
    if (key === "delegate") {
        if (hasSortProperty(m, key)) return m.delegate;
    } else if (key === "nSpeakers") {
        if (hasSortProperty(m, key)) return m.totalTime / m.speakingTime;
    } else if (key === "speakingTime") {
        if (hasSortProperty(m, key)) return m.speakingTime;
    } else if (key === "topic") {
        if (hasSortProperty(m, key)) return m.topic;
    } else if (key === "totalTime") {
        if (hasSortProperty(m, key)) return m.totalTime;
    } else {
        key satisfies never;
    }

    throw Error(`Motion cannot be sorted by ${key}`);
}

export function compareMotions(priority: SortEntry[]): Comparator<Motion> {
    return (a, b) => {
        let k: number;

        // Check indices match:
        let ai = getSortIndex(a, priority);
        let bi = getSortIndex(b, priority);

        if (k = compare(ai, bi)) return k;
        
        // Run through the order until we find a difference:
        let order = priority[ai ?? bi]?.order;
        if (typeof order !== "undefined") {
            for (let { property, ascending } of order) {
                let av = getSortProperty(a, property);
                let bv = getSortProperty(b, property);
    
                if (k = compare(av, bv, !ascending)) return k;
            }
        }

        return 0;
    }
}