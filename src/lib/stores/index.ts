import { getContext, setContext } from "svelte";
import { persisted } from "svelte-persisted-store";
import type { Readable, Writable } from "svelte/store";
import { SHADOW_ITEM_MARKER_PROPERTY_NAME as isDndShadowItem } from "svelte-dnd-action";
import { getDndItemId } from "$lib/util/dnd";

// For the purposes of this project, a store consists of:
//  1. Writable properties
//  2. Derived properties (properties that are calculated from other properties)
//  3. Const properties (static properties that are generated once)
// These three different kinds of properties are handled specifically by the type management below.

/* TYPE STUFF */

// This type stuff doesn't *really* need to be understood, 
// but it's used to facilitate easy typing for the other files in this folder.

// These _KeysXX types are used to filter the keys of a given object type..
/**
 * Gets all keys of Ctx whose values are of type Writable<_>
 */
type _KeysWritable<Ctx extends {}> = { [K in keyof Ctx]: Ctx[K] extends Writable<unknown> ? K : never }[keyof Ctx];
/**
 * Gets all keys of Ctx whose values are of type Readable<_> (or Writable<_>)
 */
type _KeysReadable<Ctx extends {}> = { [K in keyof Ctx]: Ctx[K] extends Readable<unknown> ? K : never }[keyof Ctx];
/**
 * Gets all keys of Ctx which represent a "default" property (1 in above definition)
 */
type _KeysDefault<Ctx extends {}> = _KeysWritable<Ctx>;
/**
 * Gets all keys of Ctx which represent a "derived" property (2 in above definition)
 */
type _KeysDerived<Ctx extends {}> = Exclude<_KeysReadable<Ctx>, _KeysWritable<Ctx>>;
/**
 * Gets all keys of Ctx which represent a "const" property (3 in above definition)
 */
type _KeysConst<Ctx extends {}>   = Exclude<keyof Ctx, _KeysReadable<Ctx>>;

// These types split a given object into the 3 different items defined above.
/**
 * Filters an object Ctx to only its "default" properties (def. 1)
 */
type WDefaults<Ctx extends {}> = { [K in _KeysDefault<Ctx>]: Ctx[K] };
/**
 * Filters an object Ctx to only its "default" properties (def. 1), 
 * and strips the `Writable<_>` wrapper around each value type.
 */
type Defaults<Ctx extends {}> = { [K in _KeysDefault<Ctx>]: Ctx[K] extends Writable<infer V> ? V : never };
/**
 * Filters an object Ctx to only its "derived" properties (def. 2)
 */
type Derived<Ctx extends {}> = { [K in _KeysDerived<Ctx>]: Ctx[K] };
/**
 * Filters an object Ctx to only its "const" properties (def. 3)
 */
type Consts<Ctx extends {}> = { [K in _KeysConst<Ctx>]: Ctx[K] };

/* END TYPE STUFF */

/**
 * Creates all the useful functions and properties needed for a persistent store.
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
 * const { getDefaults, createContext, resetContext, getStoreContext } = createStore<Settings>(
 *   // defaults for all writable properties:
 *   { enableFoo: false, enableBar: false },
 *   // create all derived properties:
 *   (data) => ({ fooAndBarEnabled: derived([enableFoo, enableBar], ([$foo, $bar]) => $foo && $bar) }),
 *   // create all const properties:
 *   () => ({ baz: true })
 * )
 * ```
 * 
 * This function will automatically construct the persistent stores for each default property.
 * Each store can be created (in a `+layout.svelte`) with `createContext` and accessed with `getStoreContext`.
 * 
 * Additionally, by specifying a type parameter, this function can give type-autocomplete support while
 * defining each of the three kinds of properties.
 * 
 * @param key a unique key to use for Svelte `getContext`/`setContext` and when storing for persistence
 * @param defaults an object defining defaults for all writable fields (this can also be a function that defines all the defaults)
 * @param derived a function that takes all the defaults and const values and produces an object defining all derived properties
 * @param consts a function that defines all const properties
 * @returns an object holding a few fields:
 *     - `getDefaults()`: a function that returns all of the defaults of the function
 *     - `createContext()`: a function that initializes and creates the store (should be called in the top-level of a `+layout.svelte` file)
 *     - `resetContext(ctx)`: a function that resets all writable properties of a store to their defaults
 *     - `getStoreContext()`: a function returning the store (can also be accessed normally via `getContext<Ctx>(key)`)
 */
export function createStore<Ctx extends {}>(
    key: string, 
    defaults: Defaults<Ctx> | (() => Defaults<Ctx>), 
    derived: (df: WDefaults<Ctx> & Consts<Ctx>) => Derived<Ctx>, 
    consts: () => Consts<Ctx>
) {
    const getDefaults = () => typeof defaults === "function" ? (defaults as () => Defaults<Ctx>)() : structuredClone(defaults);
    const createContext = () => {
        // Create defaults with writable fields:
        const dfCtx = Object.fromEntries(
            Object.entries(getDefaults())
                .map(([k, v]) => [k, persisted(`${key}.${k}`, v, {
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
                })])
        ) as unknown as WDefaults<Ctx>;

        // Add consts to it:
        const dfcCtx = Object.assign(dfCtx, consts());
        // Add derived properties to it:
        const ctx = Object.assign(dfcCtx, derived(dfcCtx));
        return setContext(key, ctx);
    };
    const resetContext = (ctx: Ctx) => {
        for (let entry of Object.entries(getDefaults())) {
            let [key, dflt] = entry as unknown as [_KeysDefault<Ctx>, unknown];
            (ctx[key] as Writable<unknown>).set(dflt);
        }
    }
    const getStoreContext = () => getContext<Ctx>(key);

    return { getDefaults, createContext, resetContext, getStoreContext };
}