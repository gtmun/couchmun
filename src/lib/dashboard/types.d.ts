import type { Readable, Writable } from "svelte/store";

export type DelegateAttrs = {
    name: string,
    aliases: string[]
}

// Attendance
export type DelegatePresence = "NP" | "P" | "PV";

// Motions
export type Motion = {
    delegate: string,
    kind: "mod", 
    totalTime: number,
    speakingTime: number,
    topic: string
} | {
    delegate: string,
    kind: "unmod",
    totalTime: number
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

// Define SortEntry:
export type AllKeys<T> = T extends {} ? keyof T : never;
export type SKeyUnit = AllKeys<Motion> | "nSpeakers";
export type SortOrderKey = SKeyUnit | `${SKeyUnit} asc`;
export type SortEntry = {
    kind: MotionKind | MotionKind[],
    order: SortOrderKey | SortOrderKey[]
};

// Session Data
export type SessionData = {
    /**
     * Delegate keys to characteristic data about the delegate (e.g., name and aliases)
     */
    delegateAttributes: Readable<Record<string, DelegateAttrs>>,
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
    selectedMotion: Writable<Motion | undefined>,
    /**
     * The speakers list and speaker attributes (such as whether the given speaker has spoken already)
     */
    speakersList: Writable<Speaker[]>
};