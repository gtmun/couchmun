/**
 * A module encapsulating the session context.
 * 
 * A context holds data that should be preserved across pages.
 * This includes data accessed from the database, 
 * the header title, and the header topic.
 * 
 * The benefit of including database values in the context is that 
 * the context will cache the data when traveling across pages,
 * meaning an additional database access is not necessary 
 * when entering a new page.
 * 
 * The important API here are:
 * - `getSessionContext()`: Gets the session context.
 * - `resetSessionContext(ctx)`: Clears related database data + session context data.
 * - `createSessionContext()`: Creates a new session context (if one does not exist).
 *     This typically does not need to be done since it's done once in `./routes/+layout.svelte`.
 */

import { db, DEFAULT_SESSION_DATA, DEFAULT_SETTINGS } from "$lib/db/index.svelte";
import type { SessionContext } from "$lib/types";
import { getContext, hasContext, setContext } from "svelte";

const CONTEXT_KEY = "session";

// A wrapper class so Svelte is willing to make barTopic $state real.
class SessionImpl implements SessionContext {
    delegates = db.enabledDelegatesStore();
    // Global Session Data
    motions = db.sessionDataStore("motions", DEFAULT_SESSION_DATA.motions);
    selectedMotion = db.sessionDataStore("selectedMotion", DEFAULT_SESSION_DATA.selectedMotion);
    selectedMotionState = db.sessionDataStore("selectedMotionState", DEFAULT_SESSION_DATA.selectedMotionState);
    speakersList = db.sessionDataStore("speakersList", DEFAULT_SESSION_DATA.speakersList);
    // Settings
    sortOrder = db.settingStore("sortOrder", DEFAULT_SETTINGS.sortOrder);
    barTitle = db.settingStore("title", "");
    preferences = db.settingStore("preferences", DEFAULT_SETTINGS.preferences);

    barTopic = $state<string>();
    tabTitleExtras = $state<string>();
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
    ctx.tabTitleExtras = undefined;
}