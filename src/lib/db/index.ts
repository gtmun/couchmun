import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import type { DelegatePresence, StatsData } from "$lib/types";
import { Dexie, type EntityTable } from "dexie";

interface Delegate {
    // Indexes:
    id: number,
    name: string,
    aliases: string[]

    // Non-indexes:
    order: number,
    enabled: boolean,
    flagURL: string,
    presence: DelegatePresence,
    stats: StatsData
}
interface SessionDatabase extends Dexie {
    delegates: EntityTable<Delegate, "id">
}

export const db = new Dexie("sessionDatabase") as SessionDatabase;
db.version(1).stores({
    delegates: "++id, name, *aliases"
});
db.on("populate", (tx) => {
    let { delegates }: { delegates: SessionDatabase["delegates"] } = tx as any;
    delegates.bulkAdd(
        Object.entries(DEFAULT_DELEGATES)
            .map(([key, { name, aliases, flagURL }], i) => ({
                name, aliases,
                order: i,
                enabled: true,
                flagURL: flagURL ?? getFlagUrl(key)?.toString() ?? getFlagUrl("un")!.toString(),
                presence: "NP",
                stats: {
                    motionsProposed: 0,
                    motionsAccepted: 0,
                    timesSpoken: 0,
                    durationSpoken: 0
                }
            }))
    )
});