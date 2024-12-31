/**
 * Delegate table definition for the session database.
 */

import type { DelegateAttrs, DelegateID, DelegatePresence, DelSessionData, StatsData } from "$lib/types";
import { Entity } from "dexie";
import type { SessionDatabase } from "./index.svelte";

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

    /**
     * Checks a delegate presence status is present.
     * @param p the presence status
     * @returns whether it indicates presence
     */
    isPresent(): boolean {
        return this.presence != "NP";
    }
    /**
     * Checks if name is associated with a given delegate.
     * @param name name we're looking at
     * @returns whether this delegate could correctly be referred to by the given name
     */
    nameEquals(name: string): boolean {
        // case-insensitive equals
        const eq = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) == 0;
        return eq(this.name, name) || this.aliases.some(n => eq(n, name));
    }

    /**
     * @returns the attributes of this delegate
     */
    getAttributes(): DelegateAttrs {
        return {
            name: this.name,
            aliases: structuredClone(this.aliases),
            flagURL: this.flagURL,
        };
    }
    getSessionData(): DelSessionData {
        return {
            presence: this.presence,
            stats: structuredClone(this.stats),
        }
    }
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
