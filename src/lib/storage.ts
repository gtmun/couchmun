/**
 * A persistent storage module.
 * 
 * If written to, data is preserved through page resets, browser closes, computer restarts, etc.
 */

import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

export interface PersistentStorage<T> extends Writable<T> {
    /**
     * Deletes the key from localStorage.
     * 
     * The value is only preserved after the storage is set again.
     */
    delete(): void;
}

/**
 * Creates a new writable store that automatically stores its data to localStorage.
 * @param key The key to write in localStorage
 * @param dflt The default value, if it doesn't exist in localStorage
 * @returns the new writable store
 */
export function persistentStorage<T>(key: string, dflt: T | undefined = undefined): PersistentStorage<T> {
    // If storage has a value in it, then use it.
    // Otherwise, use the default (if it exists).
    let storageStr = browser ? localStorage.getItem(key) : null;
    
    let storageVal: T | undefined = dflt;
    if (typeof storageStr === "string") {
        try {
            storageVal = JSON.parse(storageStr);
        } catch (e) {
            // Parsing failed, so ignore JSON
        }

        // If storageVal is an object, we augment the dflt value onto it to ensure there is always a backup:
        if (typeof storageVal === "object" && storageVal !== null && !(storageVal instanceof Array)) {
            storageVal = { ...dflt, ...storageVal };
        }
    }

    const store = writable<T>(storageVal);
    let firstAccess = true;
    store.subscribe(newVal => {
        // Svelte will call this function once after subscribing,
        // which is pointless because the value input immediately after subscribing 
        // is either a default (unnecessary) or a value already in localStorage (also unnecessary).
        if (firstAccess) {
            firstAccess = false;
            return;
        }

        // On edit, add to local storage
        try {
            if (browser) {
                localStorage.setItem(key, JSON.stringify(newVal));
            } else {
                console.warn(`could not store ${key}: ${newVal} to localStorage: storage was set outside of browser`)
            }
        } catch (e) {
            console.warn(`could not store ${key}: ${newVal} to localStorage: ${e}`);
        }
    });

    return {
        ...store, 
        delete: () => {
            localStorage.removeItem(key);
        }
    };
}