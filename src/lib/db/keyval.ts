/**
 * Table definition of key-val stores for the session database.
 */

import { Entity } from "dexie";
import type { SessionDatabase } from "./index.svelte";

export class KeyValuePair extends Entity<SessionDatabase> {
    key!: string;
    val!: any;

    static readonly indexes = "key";

    async setValue(val: any) {
        await (this.db[this.table()] as any).update(this.key, { val });
    }
}

interface IKeyValue {
    key: string;
    val: any;
}
export function toObject(kvs: IKeyValue[]): Record<string, unknown> {
    return Object.fromEntries(kvs.map(({key, val}) => [key, val]));
}
export function toKeyValueArray(o: Record<string, any>): IKeyValue[] {
    return Object.entries(o).map(([key, val]) => ({ key, val: structuredClone(val) }));
}