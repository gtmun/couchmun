import { db } from "$lib/db/index.svelte";
import type { SessionData } from "$lib/types";
import { getDndItemId } from "$lib/util/dnd";
import { getContext, hasContext, setContext } from "svelte";
import { persisted } from "svelte-persisted-store";
import { SHADOW_ITEM_MARKER_PROPERTY_NAME as isDndShadowItem } from "svelte-dnd-action";

const CONTEXT_KEY = "session";

/**
 * Data that is persisted onto localStorage.
 * 
 * This also has the added benefit of not storing svelte-dnd-action artifacts into localStorage.
 */
function localStore<T>(k: string, v: T) {
    return persisted(k, v, {
        beforeRead(o) {
            // Process changes made due to svelte-dnd-action
            if (o instanceof Array) {
                for (let item of o) {
                    if ("id" in item) {
                        item.id = getDndItemId(item);
                    }
                    delete item[isDndShadowItem];
                    delete item.originalId;
                }
            }

            return o;
        }
    });
}

// A wrapper class so Svelte is willing to make barTopic $state real.
class SessionImpl implements SessionData {
    delegates = db.enabledDelegatesStore();
    motions = localStore("sessionData.motions", []); // TODO: replace with DB
    selectedMotion = localStore("sessionData.selectedMotion", null); // TODO: replace with DB
    speakersList = localStore("sessionData.speakersList", []); // TODO: replace with DB
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
    return getContext<SessionData>(CONTEXT_KEY);
}

/**
 * Creates the session context object (if it hasn't been created).
 * 
 * @returns the context object
 */
export function createSessionContext() {
    if (hasContext(CONTEXT_KEY)) return getSessionContext();
    return setContext<SessionData>(CONTEXT_KEY, new SessionImpl());
}
/**
 * Resets properties of the session.
 */
export async function resetSessionContext(ctx: SessionContext) {
    await db.resetSessionData();

    // Additional attributes to clear:
    ctx.motions.set([]);
    ctx.selectedMotion.set(null);
    ctx.speakersList.set([]);
    ctx.barTopic = undefined;
}