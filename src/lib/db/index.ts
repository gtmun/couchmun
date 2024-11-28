import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import type { DelegateAttrs, DelegatePresence, StatsData } from "$lib/types";
import { Dexie, type EntityTable } from "dexie";

export interface Delegate {
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

db.on("ready", async (tx) => {
    let txdb = tx as typeof db;
    if (await txdb.delegates.count() == 0) {
        // Populate:
        await addDelPresetData(txdb.delegates, DEFAULT_DELEGATES);
    }
})

export async function populateSessionData(attrs: DelegateAttrs, key: string, order: number): Promise<Omit<Delegate, "id">> {
    let { name, aliases, flagURL: mFlagURL } = attrs;
    let flagURL = mFlagURL ?? (await getFlagUrl(key))?.href ?? (await getFlagUrl("un"))!.href;
    return {
        name, aliases,

        order: order,
        enabled: true,
        flagURL,
        presence: "NP",
        stats: {
            motionsProposed: 0,
            motionsAccepted: 0,
            timesSpoken: 0,
            durationSpoken: 0
        }
    };
}
export async function addDelPresetData(table: EntityTable<Delegate, "id">, attrs: Record<string, DelegateAttrs>) {
    let items = await Promise.all(
        Object.entries(attrs)
            .map(([key, attrs], i) => populateSessionData(attrs, key, i))
    );
    return table.bulkAdd(items);
}