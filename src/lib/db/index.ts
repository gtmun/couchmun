import { Delegate } from "./delegates";
import { KeyValuePair, toKeyValueArray } from "./keyval";
import { DEFAULT_DELEGATES } from "$lib/delegate_presets";
import { getFlagUrl } from "$lib/flags/flagcdn";
import { DEFAULT_SORT_PRIORITY } from "$lib/motions/definitions";
import type { DelegateAttrs, DelegateID, Settings } from "$lib/types";
import { Dexie, liveQuery, type EntityTable, type IndexableType, type InsertType } from "dexie";
import { readable, type Readable, type Updater, type Writable } from "svelte/store";

export class SessionDatabase extends Dexie {
    delegates!: EntityTable<Delegate, "id">;
    settings!: EntityTable<KeyValuePair, "key">;
    sessionData!: EntityTable<KeyValuePair, "key">;

    constructor() {
        super("sessionDatabase", { cache: "immutable" });
        this.version(1).stores({
            delegates: Delegate.indexes,
            settings: KeyValuePair.indexes,
            sessionData: KeyValuePair.indexes,
        });
        this.delegates.mapToClass(Delegate);
        this.settings.mapToClass(KeyValuePair);
        this.sessionData.mapToClass(KeyValuePair);
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
     * Gets a readable store of all enabled delegates.
     * This can be used during a session to get a list of delegates.
     * 
     * Note that this does not give a list of *only* present delegates.
     * To do that, you need to additionally filter the result of this store:
     * 
     * ```ts
     * const delegates = db.enabledDelegatesStore();
     * const presentDelegates = $delegates.filter(d => d.isPresent());
     * ```
     * 
     * @returns the store
     */
    enabledDelegatesStore(): Readable<Delegate[]> {
        return queryStore(() => {
            return db.delegates.orderBy("order")
                .filter(e => e.enabled)
                .toArray();
        }, []);
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
        const set = (val: Value) => this.settings.update(key, { val });
        const update = (updater: Updater<Value>) => this.settings.update(key, o => {
            o.val = updater(o.val);
        });
        return Object.assign(store, { set, update });
    }
    async resetSettings() {
        await this.transaction("rw", this.settings, async () => {
            await this.settings.clear();
            await this.settings.bulkAdd(toKeyValueArray(DEFAULT_SETTINGS));
        });
    }

    async resetSessionData() {
        await this.transaction("rw", [this.sessionData, this.delegates], async () => {
            await this.delegates.toCollection().modify(DEFAULT_DEL_SESSION_DATA);
            
            await this.sessionData.clear();
            await this.sessionData.bulkAdd(toKeyValueArray(DEFAULT_SESSION_DATA));
        })
    }
}

export const db = new SessionDatabase();

db.on("ready", async (tx) => {
    let txdb = tx as typeof db;
    if (await txdb.delegates.count() == 0) {
        const dels = await _legacyFixDelFlag(DEFAULT_DELEGATES);
        await txdb.addDelegates(dels);
    }
    if (await txdb.settings.count() == 0) {
        await txdb.resetSettings();
    }
    if (await txdb.sessionData.count() == 0) {
        await txdb.sessionData.bulkAdd(toKeyValueArray(DEFAULT_SESSION_DATA));
    }
})

/**
 * Default session data per delegate.
 */
export const DEFAULT_DEL_SESSION_DATA = {
    presence: "NP",
    stats: {
        motionsProposed: 0,
        motionsAccepted: 0,
        timesSpoken: 0,
        durationSpoken: 0
    }
} as const;

export const DEFAULT_SESSION_DATA = {
    motions: [],
    selectedMotion: null,
    speakersList: []
} as const;

/**
 * Default settings.
 */
export const DEFAULT_SETTINGS = {
    sortOrder: DEFAULT_SORT_PRIORITY,
    title: "General Assembly",
    preferences: {
        enableMotionRoundRobin: true,
        enableMotionExt: true,
        pauseMainTimer: true,
    }
} satisfies Settings;

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
    }, DEFAULT_DEL_SESSION_DATA);
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
 * A store on a database query that updates when the database updates.
 * 
 * This is similar to Dexie's `liveQuery`, except with some adjustments to better support Svelte.
 * Notably, this adds the option to give a default value and doesn't reload on page switch
 * if put in a context.
 * 
 * @param cb the querier function
 */
export function queryStore<T>(cb: () => T | Promise<T>): Readable<T | undefined>;
export function queryStore<T>(cb: () => T | Promise<T>, fallback: T): Readable<T>;
export function queryStore<T>(cb: () => T | Promise<T>, fallback?: T) {
    const query = liveQuery(cb);
    return readable(fallback, (set) => query.subscribe(set).unsubscribe);
}