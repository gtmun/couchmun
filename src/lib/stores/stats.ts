import type { StatsData, StatsDataStore } from "$lib/types";
import { createStore } from ".";

const { createContext, resetContext, getStoreContext } = createStore<StatsDataStore>("statistics",
    {
        stats: {}
    },
    () => ({}),
    () => ({})
)

export function defaultStats(): StatsData {
    return {
        motionsProposed: 0,
        motionsAccepted: 0,
        timesSpoken: 0,
        durationSpoken: 0
    };
}

export function updateStats(stats: StatsDataStore["stats"], key: string | undefined, cb: (val: StatsData) => void) {
    if (typeof key === "string") stats.update($s => {
        $s[key] ??= defaultStats();
        cb($s[key]);
        return $s;
    });
}
export {
    createContext as createStatsContext,
    resetContext as resetStatsContext,
    getStoreContext as getStatsContext
};