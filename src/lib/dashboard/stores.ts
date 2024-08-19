import { derived, writable } from "svelte/store";
import type { DelegatePresence, SessionData } from "./types";
import { createAccessibleSettings } from "$lib/settings/stores";
import { setContext } from "svelte";

export const SESSION_DATA_KEY = "sessionData";

export function createSessionDataContext(): SessionData {
    const delegateAttendance = writable<Record<string, DelegatePresence>>({});
    const presentDelegates = derived(delegateAttendance, $att => {
        return Object.keys($att).filter(k => $att[k] !== "NP");
    });
    
    return setContext<SessionData>(SESSION_DATA_KEY, {
        settings: createAccessibleSettings(),
        delegateAttendance,
        presentDelegates,
        motions: writable([]),
        selectedMotion: writable(),
        speakersList: writable([])
    });
}

/**
 * Resets session data context, preserving any settings.
 */
export function resetSessionDataContext(ctx: SessionData) {
    ctx.delegateAttendance.set({});
    ctx.motions.set([]);
    ctx.selectedMotion.set(undefined);
    ctx.speakersList.set([]);
}