/**
 * Delegate table definition for the session database.
 */

import type { DelegateID, DelegatePresence, StatsData } from "$lib/types";
import { Entity, type IndexableType } from "dexie";
import type { SessionDatabase } from ".";

export class Delegate extends Entity<SessionDatabase> {
    // Indexes:
    id!: DelegateID;
    name!: string;
    aliases!: string[];
    order!: number;

    // Non-indexes:
    enabled!: boolean;
    flagURL!: string;
    presence!: DelegatePresence;
    stats!: StatsData;

    static readonly indexes = "++id, name, *aliases, order";
}

/**
 * Find the delegate with the matching ID (note this is linear search).
 * @param d Delegate list
 * @param searchId Search ID
 * @returns The matching delegate (if they exist)
 */
export function findDelegate(d: Delegate[], searchId: DelegateID): Delegate | undefined {
    // linear but bleh it's synchronous so whatever
    return d.find(({id}) => id == searchId);
}

/**
 * Updates one entry from the delegate table.
 * 
 * This should only be used for single-time, short updates.
 * Large changes (such as changing multiple delegates at once) 
 * should go through Dexie's bulk update methods
 * and multiple operations should go through transactions.
 * 
 * @param table the delegate table
 * @param id the ID of the entry to update
 * @param param parameters to `Dexie.Table.update` 
 *     (either a callback that updates an item or an object indicating what parameters to update)
 * @returns a promise on completion
 */
export async function updateDelegate(table: SessionDatabase["delegates"], id: DelegateID | undefined, param: Parameters<SessionDatabase["delegates"]["update"]>[1]): Promise<void>; 
export async function updateDelegate(table: SessionDatabase["delegates"], id: DelegateID | undefined, param: ((obj: Delegate, ctx: { value: any; primKey: IndexableType; }) => void | boolean)): Promise<void>;
export async function updateDelegate(table: SessionDatabase["delegates"], id: DelegateID | undefined, param: any): Promise<void> {
    if (typeof id !== "number") return;
    await table.update(id, param);
}
