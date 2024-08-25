import { getContext, setContext } from "svelte";
import { persisted } from "svelte-persisted-store";
import type { Readable, Writable } from "svelte/store";

type _KeysWritable<Ctx extends {}> = { [K in keyof Ctx]: Ctx[K] extends Writable<unknown> ? K : never }[keyof Ctx];
type _KeysReadable<Ctx extends {}> = { [K in keyof Ctx]: Ctx[K] extends Readable<unknown> ? K : never }[keyof Ctx];
type _KeysDefault<Ctx extends {}> = _KeysWritable<Ctx>;
type _KeysDerived<Ctx extends {}> = Exclude<_KeysReadable<Ctx>, _KeysWritable<Ctx>>;
type _KeysConst<Ctx extends {}>   = Exclude<keyof Ctx, _KeysReadable<Ctx>>;

type WDefaults<Ctx extends {}> = { [K in _KeysDefault<Ctx>]: Ctx[K] };
type Defaults<Ctx extends {}> = { [K in _KeysDefault<Ctx>]: Ctx[K] extends Writable<infer V> ? V : never };
type Derived<Ctx extends {}> = { [K in _KeysDerived<Ctx>]: Ctx[K] };
type Consts<Ctx extends {}> = { [K in _KeysConst<Ctx>]: Ctx[K] };

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
                .map(([k, v]) => [k, persisted(`${key}.${k}`, v)])
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