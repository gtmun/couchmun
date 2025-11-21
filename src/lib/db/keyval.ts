/**
 * Table definition of key-val stores for the session database.
 */

import { Entity } from "dexie";

import type { SessionDatabase } from "./index.svelte";

export class KeyValuePair<K = string, V = any> extends Entity<SessionDatabase> implements IKeyValue<K, V> {
    key!: K;
    val!: V;

    static readonly indexes = "key";
}

interface IKeyValue<K = string, V = any> {
    key: K;
    val: V;
}
export function toObject<V>(kvs: IKeyValue<any, V>[]): Record<string, V> {
    return Object.fromEntries(kvs.map(({key, val}) => [key, val]));
}
export function toKeyValueArray<V>(o: Record<string, V>): IKeyValue<string, V>[] {
    return Object.entries(o).map(([key, val]) => ({ key, val: structuredClone(val) }));
}