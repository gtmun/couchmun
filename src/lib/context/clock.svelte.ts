import { createContext, onMount } from "svelte";

import ClockSourceWorker from "#lib/util/clock-worker?worker";

/**
 * A synchronized clock source.
 * 
 * Any value dependent on this source's `tick` field
 * will observe the same clock and will be synchronized.
 */
export class ClockSource {
    #tick = $state(0);

    constructor() {
        onMount(() => {
            const worker = new ClockSourceWorker();
            const setTick = ({ data }: MessageEvent<number>) => this.#tick = data;

            worker.addEventListener("message", setTick);
            return () => {
                worker.removeEventListener("message", setTick);
                worker.terminate();
            }
        });
    }

    get tick() {
        return this.#tick;
    }
}

const [getClockContext, setClockContext] = createContext<ClockSource>();
export {
    /** Returns the context for the global clock source. */
    getClockContext
};
/** Creates a context that points to the global clock source. */
export function createClockContext() {
    return setClockContext(new ClockSource());
}