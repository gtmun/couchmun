import { derived } from "svelte/store";
import { createAccessibleSettings } from "$lib/stores/settings";
import type { SessionData } from "$lib/types";
import { createStore } from ".";

const { createContext, resetContext, getStoreContext } = createStore<SessionData>("sessionData",
    {
        delegateAttendance: {},
        motions: [],
        selectedMotion: null,
        speakersList: []
    },
    ({ delegateAttendance }) => ({
        presentDelegates: derived(delegateAttendance, $att => Object.keys($att).filter(k => $att[k] !== "NP"))
    }),
    () => ({
        settings: createAccessibleSettings()
    })
)

export {
    createContext as createSessionDataContext,
    resetContext as resetSessionDataContext,
    getStoreContext as getSessionDataContext
};