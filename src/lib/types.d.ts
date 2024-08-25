import type { Readable, Writable } from "svelte/store";

export type DelegateAttrs = {
    name: string,
    aliases: string[]
}

// Used to define sort entry:
export type SortKind = "mod" | "unmod" | "rr" | "other" | "ext";
export type SortOrderProperty = "totalTime" | "speakingTime" | "topic" | "delegate" | "nSpeakers";
export type SortOrderKey = {
    property: SortOrderProperty,
    ascending: boolean
};
export type SortEntry = {
    kind: SortKind[],
    order: SortOrderKey[]
};

export type Preferences = {
    enableMotionRoundRobin: boolean,
    enableMotionExt: boolean,
    pauseMainTimer: boolean
}
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
export type AccessibleSettings = {
    delegateAttributes: Readable<Record<string, DelegateAttrs>>,
    sortOrder: Readable<SortEntry[]>,
    title: Writable<string>
}

// Attendance
export type DelegatePresence = "NP" | "P" | "PV";

// Motions
export type Motion = {
    delegate: string,
    kind: "mod", 
    totalTime: number,
    speakingTime: number,
    topic: string,
    isExtension: boolean
} | {
    delegate: string,
    kind: "unmod",
    totalTime: number,
    isExtension: boolean
} | {
    delegate: string,
    kind: "rr",
    speakingTime: number,
    topic: string
} | {
    delegate: string,
    kind: "other",
    totalTime: number,
    topic: string
};
export type MotionKind = Motion["kind"];

export type Speaker = {
    key: string,
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