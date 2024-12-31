import type { SessionData } from "$lib/types";
import { hasContext } from "svelte";
import { createStore } from ".";
import { db } from "$lib/db";

const { createContext, resetContext, getStoreContext } = createStore<SessionData>("sessionData", {
    motions: [],
    selectedMotion: null,
    speakersList: []
})

export function createSessionDataContext() {
    if (hasContext("sessionData")) return getStoreContext();
    return Object.assign(createContext(), {
        delegates: db.enabledDelegatesStore(),
    });
}
export async function resetSessionDataContext(ctx: SessionData) {
    resetContext(ctx);
}

export {
    getStoreContext as getSessionDataContext
};