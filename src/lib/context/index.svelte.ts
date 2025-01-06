import { db, DEFAULT_SESSION_DATA } from "$lib/db/index.svelte";
import type { SessionContext } from "$lib/types";
import { getContext, hasContext, setContext } from "svelte";

const CONTEXT_KEY = "session";

// A wrapper class so Svelte is willing to make barTopic $state real.
class SessionImpl implements SessionContext {
    delegates = db.enabledDelegatesStore();
    motions = db.sessionDataStore("motions", DEFAULT_SESSION_DATA.motions);
    selectedMotion = db.sessionDataStore("selectedMotion", DEFAULT_SESSION_DATA.selectedMotion);
    selectedMotionState = db.sessionDataStore("selectedMotionState", DEFAULT_SESSION_DATA.selectedMotionState);
    speakersList = db.sessionDataStore("speakersList", DEFAULT_SESSION_DATA.speakersList);
    barTitle = db.settingStore("title", "");
    barTopic = $state<string>();
}

/**
 * Gets the session context object.
 * 
 * This is an object which holds all properties of the session,
 * including those accessed via the session database.
 * 
 * This context is useful in that it allows for data to persist between page changes.
 * 
 * @returns the context object
 */
export function getSessionContext() {
    return getContext<SessionContext>(CONTEXT_KEY);
}

/**
 * Creates the session context object (if it hasn't been created).
 * 
 * @returns the context object
 */
export function createSessionContext() {
    if (hasContext(CONTEXT_KEY)) return getSessionContext();
    return setContext<SessionContext>(CONTEXT_KEY, new SessionImpl());
}
/**
 * Resets properties of the session.
 */
export async function resetSessionContext(ctx: SessionContext) {
    await db.resetSessionData();

    // Additional attributes to clear:
    ctx.barTopic = undefined;
}