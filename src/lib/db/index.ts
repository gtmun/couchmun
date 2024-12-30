import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import type { DelegateAttrs, DelegateID, Settings } from "$lib/types";
import { Dexie, liveQuery, type EntityTable, type IndexableType, type InsertType, type Observable } from "dexie";
import { derived, type Readable, type Updater, type Writable } from "svelte/store";
import { Delegate } from "./delegates";
import { DEFAULT_SETTINGS, KeyValuePair, toKeyValueArray } from "./settings";

export class SessionDatabase extends Dexie {
    delegates!: EntityTable<Delegate, "id">;
    settings!: EntityTable<KeyValuePair, "key">;

    constructor() {
        super("sessionDatabase", { cache: "immutable" });
        this.version(1).stores({
            delegates: Delegate.indexes,
            settings: KeyValuePair.indexes
        });
        this.delegates.mapToClass(Delegate);
        this.settings.mapToClass(KeyValuePair);
    }

    /**
     * Updates one entry from the delegate table.
     * 
     * This should only be used for single-time, short updates.
     * Large changes (such as changing multiple delegates at once) 
     * should go through Dexie's bulk update methods
     * and multiple operations should go through transactions.
     * 
     * @param id the ID of the entry to update
     * @param param parameters to `Dexie.Table.update` 
     *     (either a callback that updates an item or an object indicating what parameters to update)
     * @returns a promise on completion
     */
    async updateDelegate(id: DelegateID | undefined, param: Parameters<SessionDatabase["delegates"]["update"]>[1]): Promise<void>; 
    async updateDelegate(id: DelegateID | undefined, param: ((obj: Delegate, ctx: { value: any; primKey: IndexableType; }) => void | boolean)): Promise<void>;
    async updateDelegate(id: DelegateID | undefined, param: any): Promise<void> {
        if (typeof id !== "number") return;
        await this.delegates.update(id, param);
    }

    /**
     * Adds a delegate with the given attributes to the delegate database.
     * @param attrs The attributes of the new delegate
     */
    async addDelegate(attrs: DelegateAttrs) {
        await this.transaction("rw", this.delegates, async () => {
            const order = await this.delegates.count();
            const newDel = populateDelegate(attrs, order);
            await this.delegates.add(newDel);
        })
    }
    /**
     * Adds a set of delegates with the given attributes to the delegate database.
     * @param delegates the attributes of the new delegates
     */
    async addDelegates(delegates: DelegateAttrs[]) {
        await this.transaction("rw", this.delegates, async () => {
            const order = await this.delegates.count();
            const newDels = delegates.map((attrs, i) => populateDelegate(attrs, order + i));
            await this.delegates.bulkAdd(newDels);
        })
    }

    /**
     * Gets the setting from the settings database.
     * @param key the key to get the setting for
     * @returns the value of the setting
     */
    async getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
        return (await this.settings.get(key))!.val;
    }
    /**
     * Creates a writable store for a given setting.
     * @param key the key to make a store for
     * @returns the store
     */
    settingStore<K extends keyof Settings>(key: K): Writable<Settings[K] | undefined>;
    settingStore<K extends keyof Settings>(key: K, default_: Settings[K]): Writable<Settings[K]>;
    settingStore<K extends keyof Settings>(key: K, default_?: Settings[K]): Writable<Settings[K] | undefined> {
        type Value = Settings[K];
        const store = queryStore<Value | undefined>(() => this.getSetting(key), default_);
        const set = (val: Value) => db.settings.update(key, { val });
        const update = (updater: Updater<Value>) => db.settings.update(key, o => {
            o.val = updater(o.val);
        });
        return Object.assign(store, { set, update });
    }
}

export const db = new SessionDatabase();

db.on("ready", async (tx) => {
    let txdb = tx as typeof db;
    if (await txdb.delegates.count() == 0) {
        // Populate:
        const dels = await _legacyFixDelFlag(DEFAULT_DELEGATES);
        await txdb.addDelegates(dels);
    }
    if (await txdb.settings.count() == 0) {
        await txdb.settings.bulkAdd(toKeyValueArray(DEFAULT_SETTINGS));
    }
})

/**
 * Default session data per delegate.
 */
export const DEFAULT_SESSION_DATA = {
    presence: "NP",
    stats: {
        motionsProposed: 0,
        motionsAccepted: 0,
        timesSpoken: 0,
        durationSpoken: 0
    }
} as const;

/**
 * Adds attributes to a given delegate, allowing it to be inserted into the database.
 * @param attrs the attributes the delegate already has
 * @param order its position in the database
 * @returns the new object which contains all database attributes for the delegate
 */
function populateDelegate(attrs: DelegateAttrs, order: number): InsertType<Delegate, "id"> {
    let { name, aliases, flagURL: mFlagURL } = attrs;
    return Object.assign({
        name, aliases, order, enabled: true, flagURL: mFlagURL ?? ""
    }, DEFAULT_SESSION_DATA);
}
/**
 * Method to handle legacy `Record<string, DelegateAttrs>` format.
 * @param flagKey the flag key
 * @param attrs the delegate attributes
 */
export async function _legacyFixDelFlag(flagKey: string, attrs: DelegateAttrs): Promise<DelegateAttrs>;
/**
 * Method to handle legacy `Record<string, DelegateAttrs>` format.
 * @param delegates the list of delegates, as a flag key-delegate attribute mapping.
 */
export async function _legacyFixDelFlag(delegates: Record<string, DelegateAttrs>): Promise<DelegateAttrs[]>;
export async function _legacyFixDelFlag(flagKeyOrDelegates: string | Record<string, DelegateAttrs>, attrs?: DelegateAttrs): Promise<DelegateAttrs | DelegateAttrs[]> {
    if (typeof flagKeyOrDelegates === "string" && typeof attrs === "object") {
        let flagKey = flagKeyOrDelegates;
        let { name, aliases, flagURL: mFlagURL } = attrs;
        let flagURL = mFlagURL ?? (await getFlagUrl(flagKey))?.href ?? (await getFlagUrl("un"))!.href;
        return { name, aliases, flagURL };
    } else if (typeof flagKeyOrDelegates === "object") {
        let delegates = flagKeyOrDelegates;
        return Promise.all(
            Object.entries(delegates)
                .map(([k, attrs]) => _legacyFixDelFlag(k, attrs))
        );
    } else {
        throw new TypeError("Invalid arguments");
    }
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