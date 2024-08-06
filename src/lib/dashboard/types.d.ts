import type { Readable, Writable } from "svelte/store";

// Delegate data map
export type DelegateMap = {
    [code: string]: DelegateAttrs
}
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
    kind: "other",
    totalTime: number,
    topic: string
};
export type MotionKind = Motion["kind"];

// Session Data
export type SessionData = {
    delegateAttendance: Writable<Record<string, DelegatePresence>>,
    motions: Writable<Motion[]>,
    presentDelegates: Readable<string[]>
};