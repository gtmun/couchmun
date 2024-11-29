import { createAccessibleSettings } from "$lib/stores/settings";
import type { SessionData } from "$lib/types";
import { createStore } from ".";

const { createContext, resetContext, getStoreContext } = createStore<SessionData>("sessionData",
    {
        motions: [],
        selectedMotion: null,
        speakersList: []
    },
    () => ({}),
    () => ({
        settings: createAccessibleSettings()
    })
)

export {
    createContext as createSessionDataContext,
    resetContext as resetSessionDataContext,
    getStoreContext as getSessionDataContext
};