import type { db } from ".";

export function getEnabledDelegates(table: typeof db.delegates) {
    return table.orderBy("order").filter(e => e.enabled);
}
export async function updateDel(table: typeof db.delegates, id: number | undefined, param: Parameters<typeof db.delegates.update>[1]) {
    if (typeof id !== "number") return;
    return table.db.transaction("rw", table, () => {
        table.update(id, param);
    });
}