import type { SessionData } from "$lib/types";
import { hasContext } from "svelte";
import { createStore } from ".";
import { db, DEFAULT_SESSION_DATA, queryStore } from "$lib/db";

const { createContext, resetContext, getStoreContext } = createStore<SessionData>("sessionData", {
    motions: [],
    selectedMotion: null,
    speakersList: []
})

export function createSessionDataContext() {
    if (hasContext("sessionData")) return getStoreContext();
    return Object.assign(createContext(), {
        delegates: queryStore(() => db.delegates.orderBy("order").filter(e => e.enabled).toArray(), [])
    });
}
export async function resetSessionDataContext(ctx: SessionData) {
    resetContext(ctx);
    await db.delegates.toCollection().modify(DEFAULT_SESSION_DATA);
}

export {
    getStoreContext as getSessionDataContext
};