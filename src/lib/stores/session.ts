import { createAccessibleSettings } from "$lib/stores/settings";
import type { Stores, SessionData } from "$lib/types";
import { getContext, hasContext, setContext } from "svelte";
import { createStore } from ".";
import { db, writableTableStore } from "$lib/db";

const { createContext, resetContext, getStoreContext } = createStore<SessionData>("sessionData", {
    motions: [],
    selectedMotion: null,
    speakersList: []
})

export {
    resetContext as resetSessionDataContext,
    getStoreContext as getSessionDataContext
};

// TODO: cleanup, both of these
export function getSessionStores() {
    return getContext<Stores>("stores");
}
export function createSessionDataContext() {
    if (!hasContext("sessionData")) {
        Object.assign(createContext(), {
            settings: createAccessibleSettings()
        });
    }
    if (!hasContext("stores")) {
        setContext<Stores>("stores", {
            delegates: writableTableStore(
                db.delegates, (table) => 
                table.orderBy("order").filter(e => e.enabled).toArray()
            )
        });
    }
}