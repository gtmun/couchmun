import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import type { DelegateAttrs, DelegatePresence, StatsData } from "$lib/types";
import { Dexie, liveQuery, type EntityTable, type Observable } from "dexie";
import { get, type Readable, type Updater, type Writable } from "svelte/store";

export interface Delegate {
    // Indexes:
    id: number,
    name: string,
    aliases: string[]
    order: number,

    // Non-indexes:
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
    delegates: "++id, name, *aliases, order"
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


/**
 * This cast converts an `Observable` to `Readable`, without having to fight TypeScript errors.
 * 
 * This cast is always acceptable, because `Readable` *does* accept the `Observable` interface,
 * it is just not documented in the TypeScript typing (as of Svelte 5.2.10).
 * 
 * @param t the observable to wrap
 * @returns the readable that results (note that `t == wrapQuery(t)`)
 */
function wrapQuery<T>(t: Observable<T>): Readable<T> {
    return t as any;
}
export function queryStore<T>(cb: () => T | Promise<T>): Readable<T> {
    return wrapQuery(liveQuery(cb));
}
export function writableTableStore<T, U extends keyof T>(table: EntityTable<T, U>, mapper: (data: EntityTable<T, U>) => (T[] | Promise<T[]>)): Writable<T[]> {
    let query = queryStore(() => mapper(table));
    let set = (v: T[]) => table.db.transaction("rw", table, () => table.bulkPut(v));
    let update = (cb: Updater<T[]>) => set(cb(get(query)));
    
    return Object.assign(query, { set, update });
}