import { getContext, hasContext, setContext } from "svelte";
import { persisted } from "svelte-persisted-store";
import type { Writable } from "svelte/store";
import { SHADOW_ITEM_MARKER_PROPERTY_NAME as isDndShadowItem } from "svelte-dnd-action";
import { getDndItemId } from "$lib/util/dnd";

/* TYPE STUFF */

// This type stuff doesn't *really* need to be understood, 
// but it's used to facilitate easy typing for the other files in this folder.

/**
 * Gets all keys of Ctx whose values are of type Writable<_>
 */
type _KeysWritable<Ctx extends {}> = { [K in keyof Ctx]: Ctx[K] extends Writable<unknown> ? K : never }[keyof Ctx];

/**
 * Filters an object Ctx to only its writable entries (which are the ones that can have defaults)
 * and strips the `Writable<_>` wrapper around each value type.
 */
type Defaults<Ctx extends {}> = { [K in _KeysWritable<Ctx>]: Ctx[K] extends Writable<infer V> ? V : never };

/* END TYPE STUFF */

/**
 * Data that is persisted onto localStorage.
 * 
 * This also has the added benefit of not storing svelte-dnd-action artifacts into localStorage.
 */
function localStore<T>(k: string, v: T) {
    return persisted(k, v, {
        beforeRead(o) {
            // Process changes made due to svelte-dnd-action
            if (o instanceof Array) {
                for (let item of o) {
                    if ("id" in item) {
                        item.id = getDndItemId(item);
                    }
                    delete item[isDndShadowItem];
                    delete item.originalId;
                }
            }

            return o;
        }
    });
}

/**
 * Creates the basic skeleton for a persistent store.
 * 
 * Example:
 * 
 * Suppose we wanted to create a `Settings` store 
 * that we could access across pages and refreshes
 * with schema:
 * ```ts
 * // Suppose we wanted to create a store for:
 * type Settings = {
 *   // writable properties
 *   enableFoo: Writable<boolean>,
 *   enableBar: Writable<boolean>,
 *   // derived property (from the above)
 *   fooAndBarEnabled: Readable<boolean>,
 *   // const property
 *   baz: boolean
 * }
 * ```
 * 
 * We could construct it like so:
 * ```
 * const { getDefaults, createContext, resetContext, getStoreContext } = createStore<Settings>("settings", {
 *   // defaults for all writable properties:
 *   { enableFoo: false, enableBar: false },
 *   // create all derived properties:
 *   (data) => ({ fooAndBarEnabled: derived([enableFoo, enableBar], ([$foo, $bar]) => $foo && $bar) }),
 *   // create all const properties:
 *   () => ({ baz: true })
 * });
 * 
 * function createSettingsContext() {
 *     const ctx = createContext();
 *     return Object.assign(ctx, {
 *         fooAndBarEnabled: derived([ctx.foo, ctx.bar], ([$foo, $bar]) => $foo && $bar) }),
 *         baz: true
 *     });
 * }
 * ```
 * 
 * This function will automatically construct the persistent stores for each default property.
 * Each store can be created (in a `+layout.svelte`) with `createContext` and accessed with `getStoreContext`.
 * 
 * Note that this does not add non-writable properties to the object, and those have to be added manually.
 * 
 * @param key a unique key to use for Svelte `getContext`/`setContext` and when storing for persistence
 * @param defaults an object defining defaults for all writable fields (this can also be a function that defines all the defaults)
 * @returns an object holding a few fields:
 *     - `getDefaults()`: a function that returns all of the defaults of the function
 *     - `createContext()`: a function that initializes and creates the store (should be called in the top-level of a `+layout.svelte` file)
 *     - `resetContext(ctx)`: a function that resets all writable properties of a store to their defaults
 *     - `getStoreContext()`: a function returning the store (can also be accessed normally via `getContext<Ctx>(key)`)
 */
export function createStore<Ctx extends {}>(
    key: string, 
    defaults: Defaults<Ctx> | (() => Defaults<Ctx>)
) {
    type D = Defaults<Ctx>;
    const getDefaults = () => typeof defaults === "function" ? (defaults as () => D)() : structuredClone(defaults);
    const createContext = () => {
        if (hasContext(key)) return getStoreContext();

        // Create defaults with writable fields:
        const ctx = Object.fromEntries(
            Object.entries(getDefaults())
                .map(([k, v]) => [k, localStore(`${key}.${k}`, v)])
        ) as unknown as Ctx;

        return setContext(key, ctx);
    };
    const resetContext = (ctx: Ctx) => {
        // Resets all keys that have a default
        for (let entry of Object.entries(getDefaults())) {
            let [key, dflt] = entry as unknown as [keyof D, unknown];
            (ctx[key] as Writable<unknown>).set(dflt);
        }
    }
    const getStoreContext = () => getContext<Ctx>(key);

    return { getDefaults, createContext, resetContext, getStoreContext };
}