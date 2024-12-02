import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import type { Delegate, DelegateAttrs } from "$lib/types";
import { Dexie, liveQuery, type EntityTable, type InsertType, type Observable } from "dexie";
import { derived, type Readable, type Updater, type Writable } from "svelte/store";

interface SessionDatabase extends Dexie {
    delegates: EntityTable<Delegate, "id">
}

export const db = new Dexie("sessionDatabase", { cache: "immutable" }) as SessionDatabase;
db.version(1).stores({
    delegates: "++id, name, *aliases, order"
});

db.on("ready", async (tx) => {
    let txdb = tx as typeof db;
    if (await txdb.delegates.count() == 0) {
        // Populate:
        let preset = await populateDelegatePreset(DEFAULT_DELEGATES);
        txdb.delegates.bulkAdd(preset);
    }
})

export const DEFAULT_SESSION_DATA = {
    presence: "NP",
    stats: {
        motionsProposed: 0,
        motionsAccepted: 0,
        timesSpoken: 0,
        durationSpoken: 0
    }
} as const;
export async function populateDelegate(attrs: DelegateAttrs, key: string, order: number): Promise<InsertType<Delegate, "id">> {
    let { name, aliases, flagURL: mFlagURL } = attrs;
    let flagURL = mFlagURL ?? (await getFlagUrl(key))?.href ?? (await getFlagUrl("un"))!.href;
    return Object.assign({
        name, aliases, order, enabled: true, flagURL
    }, DEFAULT_SESSION_DATA);
}
export async function populateDelegatePreset(attrs: Record<string, DelegateAttrs>, start: number = 0): Promise<InsertType<Delegate, "id">[]> {
    return Promise.all(
        Object.entries(attrs)
            .map(([key, attrs], i) => populateDelegate(attrs, key, start + i))
    );
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
export function queryStore<T>(cb: () => T | Promise<T>): Readable<T | undefined>;
export function queryStore<T>(cb: () => T | Promise<T>, fallback: T): Readable<T>;
export function queryStore<T>(cb: () => T | Promise<T>, fallback?: T) {
    return derived(wrapQuery(liveQuery(cb)), $q => $q ?? fallback);
}
export function writableTableStore<T, U extends keyof T>(table: EntityTable<T, U>, mapper: (data: EntityTable<T, U>) => (T[] | Promise<T[]>)): Writable<T[]> {
    let query = queryStore(() => mapper(table), []);
    let set = async (v: T[]) => table.bulkPut(v);
    let update = async (cb: Updater<T[]>) => set(cb(await mapper(table)));
    
    return Object.assign(query, { set, update });
}