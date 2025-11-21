/**
 * Delegate table definition for the session database.
 */

import type { DelegateAttrs, DelegateID, DelegatePresence, DelSessionData, StatsData } from "$lib/types";
import { eqInsensitive, includesInsensitive } from "$lib/util";

export class Delegate {
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
     * @returns a generator of all names for the given delegate.
     */
    *names(): Generator<string> {
        yield this.name;
        for (const alias of this.aliases) yield alias;
    }

    /**
     * Checks if name is associated with a given delegate.
     * @param name name we're looking at
     * @returns whether this delegate could correctly be referred to by the given name
     */
    nameEquals(name: string): boolean {
        for (const dName of this.names()) {
            if (eqInsensitive(dName, name)) return true;
        }
        return false;
    }

    /**
     * Checks if given string is a substring of a delegate's name
     * @param sub name we're looking at
     * @returns whether the given string is a substring
     */
    nameIncludes(sub: string): boolean {
        for (const name of this.names()) {
            if (includesInsensitive(name, sub)) return true;
        }
        return false;
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
