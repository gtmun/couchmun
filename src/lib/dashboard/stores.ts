import { derived } from "svelte/store";
import type { DelegatePresence, SessionData } from "./types";
import { createAccessibleSettings } from "$lib/settings/stores";
import { setContext } from "svelte";
import { persisted } from "svelte-persisted-store";

export const SESSION_DATA_KEY = "sessionData";

export function createSessionDataContext(): SessionData {
    const delegateAttendance = persisted(`${SESSION_DATA_KEY}.delegateAttendance`, {} as Record<string, DelegatePresence>);
    const presentDelegates = derived(delegateAttendance, $att => {
        return Object.keys($att).filter(k => $att[k] !== "NP");
    });
    
    return setContext<SessionData>(SESSION_DATA_KEY, {
        settings: createAccessibleSettings(),
        delegateAttendance,
        presentDelegates,
        motions: persisted(`${SESSION_DATA_KEY}.motions`, []),
        selectedMotion: persisted(`${SESSION_DATA_KEY}.selectedMotion`, null),
        speakersList: persisted(`${SESSION_DATA_KEY}.speakersList`, [])
    });
}

/**
 * Resets session data context, preserving any settings.
 */
export function resetSessionDataContext(ctx: SessionData) {
    ctx.delegateAttendance.set({});
    ctx.motions.set([]);
    ctx.selectedMotion.set(null);
    ctx.speakersList.set([]);
}