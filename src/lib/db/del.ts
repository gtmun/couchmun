/**
 * Utilities for accessing delegate data from IndexedDB.
 */

import type { db } from ".";

/**
 * Gets a collection of all of the enabled delegates (controlled in settings) 
 * from the given delegate table in the database.
 * @param table the delegate table
 * @returns the collection
 */
export function getEnabledDelegates(table: typeof db.delegates) {
    return table.orderBy("order").filter(e => e.enabled);
}

/**
 * Updates one entry from the delegate table.
 * 
 * This should only be used for single-time, short updates.
 * Large changes (such as changing multiple delegates at once) 
 * should go through Dexie's bulk update methods.
 * 
 * @param table the delegate table
 * @param id the ID of the entry to update
 * @param param parameters to `Dexie.Table.update` 
 *     (either a callback that updates an item or an object indicating what parameters to update)
 * @returns a promise on completion
 */
export async function updateDel(table: typeof db.delegates, id: number | undefined, param: Parameters<typeof db.delegates.update>[1]) {
    if (typeof id !== "number") return;
    return table.db.transaction("rw", table, () => {
        table.update(id, param);
    });
}