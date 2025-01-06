import type { Readable, Writable } from "svelte/store";

/**
 * ID of a delegate
 */
export type DelegateID = number;
/**
 * ID of a given motion in the motion table.
 */
export type MotionID = string;
/**
 * ID of a given speaker slot in the speaker list.
 */
export type SpeakerEntryID = string;

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
 * All configurable settings.
 */
export type Settings = {
    /**
     * The established sort order.
     * Values first in the list are prioritized, with the order parameter handling ties.
     * 
     * Any kinds not specified in this list are thrown at the end.
     */
    sortOrder: SortEntry[],
    
    /**
     * The title of the assembly.
     */
    title: string,

    /**
     * Toggleable preferences.
     */
    preferences: Preferences,
};

// Attendance
export type DelegatePresence = "NP" | "P" | "PV";

// Motions
/**
 * Data relating to a motion's properties.
 */
export type Motion = {
    id: MotionID,
    delegate: DelegateID,
    kind: "mod", 
    totalTime: number,
    speakingTime: number,
    topic: string,
    isExtension: boolean
} | {
    id: MotionID,
    delegate: DelegateID,
    kind: "unmod",
    totalTime: number,
    isExtension: boolean
} | {
    id: MotionID,
    delegate: DelegateID,
    kind: "rr",
    speakingTime: number,
    topic: string
    totalSpeakers: number
} | {
    id: MotionID,
    delegate: DelegateID,
    kind: "other",
    totalTime: number,
    topic: string
};
export type MotionKind = Motion["kind"];

/**
 * Data relating to the current motion's operation.
 */
export type CurrentMotionState = {
    /**
     * Motion's speaker list (if it exists)
     */
    speakersList: Speaker[]
};

export type Speaker = {
    /**
     * Identifier for this speaker entry.
     */
    id: SpeakerEntryID,
    /**
     * The key/delegate ID of the delegate.
     */
    key: DelegateID,
    /**
     * Whether they have completed speaking.
     */
    completed: boolean
};

// Session Data
/**
 * All data stored as "session data" in the database.
 * 
 * This excludes delegate session data which is stored separately.
 */
export type SessionData = {
    sessionKey?: number,
    /**
     * All specified motions (from the points & motions page).
     */
    motions: Motion[],
    /**
     * The motion that was selected (and is currently on display in the current motion page).
     */
    selectedMotion: Motion | null,
    /**
     * The state properties of the motion.
     */
    selectedMotionState: CurrentMotionState,
    /**
     * The speakers list and speaker attributes (such as whether the given speaker has spoken already)
     */
    speakersList: Speaker[],
};
export type DelSessionData = {
    presence: DelegatePresence,
    stats: StatsData
};
export type PrevSessionData = {
    common: SessionData,
    delegates: {
        id: DelegateID,
        session: DelSessionData
    }[]
};

/**
 * All data stored in the session context.
 */
export type SessionContext = {
    /**
     * Array of enabled delegates.
     */
    delegates: Readable<Delegate[]>,
    
    /**
     * All specified motions (from the points & motions page).
     */
    motions: Writable<SessionData["motions"]>,
    /**
     * The motion that was selected (and is currently on display in the current motion page).
     */
    selectedMotion: Writable<SessionData["selectedMotion"]>,
    /**
     * The state properties of the motion.
     */
    selectedMotionState: Writable<SessionData["selectedMotionState"]>,
    /**
     * The speakers list and speaker attributes (such as whether the given speaker has spoken already)
     */
    speakersList: Writable<SessionData["speakersList"]>,

    /**
     * Committee title, visible on the app bar.
     */
    barTitle: Writable<Settings["title"]>,
    /**
     * Current topic of discussion, visible on the app bar.
     */
    barTopic: string | undefined,
};

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