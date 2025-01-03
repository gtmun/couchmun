import type { Readable, Writable } from "svelte/store";

/**
 * Attributes each delegate in a given preset should have.
 * 
 * A given preset in `delegate_presets` 
 * should match the schema `Record<string, DelegateAttrs>.
 */
export type DelegateAttrs = {
    /**
     * The official name of the delegation.
     */
    name: string,
    /**
     * Name aliases for the delegation.
     * 
     * This will never be shown, but is used to improve delegate
     * input autocomplete.
     */
    aliases: string[],

    flagURL?: string
}

// These types are used to define motion sorting.

/**
 * All possible categories of motion.
 * Note that this doesn't perfectly align to `MotionKind`.
 */
export type SortKind = "mod" | "unmod" | "rr" | "other" | "ext";
/**
 * All possible properties that can define the order between
 * motions of the same `SortKind`.
 */
export type SortOrderProperty = "totalTime" | "speakingTime" | "topic" | "delegate" | "nSpeakers";
/**
 * A `SortOrderProperty` alongside 
 * whether the items should be in ascending or descending order.
 */
export type SortOrderKey = {
    property: SortOrderProperty,
    ascending: boolean
};
/**
 * The order definition for a given set of motion categories.
 * 
 * This defines which categories to group and how to break ties 
 * between motions of the same category.
 * 
 * For example, take this `SortEntry`:
 * ```ts
 * {
 *   kind: ["mod", "rr"],
 *   order: [
 *     { property: "totalTime", ascending: false },
 *     { property: "nSpeakers", ascending: false }
 *   ]
 * }
 * ```
 * 
 * This means that for motions of type `"mod"` or `"rr"`, 
 * they should:
 * 1. first be sorted by total time in descending order, 
 * 2. then by number of spekers in descending order,
 * 3. then (implicitly) by order received.
 * 
 * A array of `SortEntry`s (`SortEntry[]`) defines the complete sort order.
 */
export type SortEntry = {
    /**
     * The categories of motion this entry applies to.
     */
    kind: SortKind[],
    /**
     * The order.
     */
    order: SortOrderKey[]
};

// These types are used to define settings.

/**
 * Simple toggle preferences.
 */
export type Preferences = {
    /**
     * Whether or not to enable the round robin motion.
     */
    enableMotionRoundRobin: boolean,
    /**
     * Whether or not to enable extensions.
     */
    enableMotionExt: boolean,
    /**
     * Whether the main timer in a moderated caucus (and related)
     * should automatically pause when the delegate timer pauses.
     */
    pauseMainTimer: boolean
}

/**
 * All configurable settings (in store format).
 */
export type Settings = {
    /**
     * Delegate keys to characteristic data about the delegate (e.g., name and aliases)
     */
    delegateAttributes: Writable<Record<string, DelegateAttrs>>,

    /**
     * The established sort order.
     * Values first in the list are prioritized, with the order parameter handling ties.
     * 
     * Any kinds not specified in this list are thrown at the end.
     */
    sortOrder: Writable<SortEntry[]>,
    
    /**
     * Keys of delegates enabled for this assembly.
     */
    delegatesEnabled: Writable<Record<string, boolean>>,

    /**
     * The title of the assembly.
     */
    title: Writable<string>,

    /**
     * Toggleable preferences.
     */
    preferences: Writable<Preferences>
};

/**
 * A wrapper type around settings to designate all accessible settings
 * in `SessionData`.
 */
export type AccessibleSettings = {
    delegateAttributes: Readable<Record<string, DelegateAttrs>>,
    sortOrder: Readable<SortEntry[]>,
    title: Writable<string>
}

// Attendance
export type DelegatePresence = "NP" | "P" | "PV";

// Motions
export type Motion = {
    id: string,
    delegate: string,
    kind: "mod", 
    totalTime: number,
    speakingTime: number,
    topic: string,
    isExtension: boolean
} | {
    id: string,
    delegate: string,
    kind: "unmod",
    totalTime: number,
    isExtension: boolean
} | {
    id: string,
    delegate: string,
    kind: "rr",
    speakingTime: number,
    topic: string
    totalSpeakers: number
} | {
    id: string,
    delegate: string,
    kind: "other",
    totalTime: number,
    topic: string
};
export type MotionKind = Motion["kind"];

export type Speaker = {
    /**
     * Identifier for this speaker entry.
     */
    id: string,
    /**
     * The key of the delegate.
     */
    key: string,
    /**
     * Whether they have completed speaking.
     */
    completed: boolean
};

// Session Data
export type SessionData = {
    settings: AccessibleSettings,
    /**
     * Attendance status of each delegate in the current session.
     */
    delegateAttendance: Writable<Record<string, DelegatePresence>>,
    /**
     * Derived attribute (based on delegateAttendance) that produces the list of present delegates.
     */
    presentDelegates: Readable<string[]>,

    /**
     * All specified motions (from the points & motions page).
     */
    motions: Writable<Motion[]>,
    /**
     * The motion that was selected (and is currently on display in the current motion page).
     */
    selectedMotion: Writable<Motion | null>,
    /**
     * The speakers list and speaker attributes (such as whether the given speaker has spoken already)
     */
    speakersList: Writable<Speaker[]>
};

// App bar data
export type AppBarData = {
    /**
     * Topic to display on the app bar
     */
    topic: string | undefined
}

export type ClockMessage = 
    | { kind: "startTick", ts: number } 
    | { kind: "endTick"}

// Stats store data:
export type StatsData = {
    /**
     * Number of motions proposed by this delegate.
     */
    motionsProposed: number,
    /**
     * Number of motions accepted by this delegate.
     */
    motionsAccepted: number,
    /**
     * Number of times this delegate has gone up to speak (in speakers list and moderated caucuses).
     */
    timesSpoken: number,
    /**
     * Total duration this delegate has gone up to speak (in speakers list and moderated caucuses), in milliseconds.
     */
    durationSpoken: number
}
export type StatsDataStore = {
    stats: Writable<Record<string, StatsData>>
}
