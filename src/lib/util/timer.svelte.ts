import { onDestroy } from "svelte";

import type { ClockSource } from "#lib/context/clock.svelte.ts";
import type { TimerInteraction, TimerSnapshot } from "#lib/types.js";
import { clamp } from "#lib/util/index.ts";
import { watchEffect } from "#lib/util/sv.svelte.ts";

/** Options for the timer. */
type TimerOptions = {
    /** 
     * A callback for the duration (in seconds) of the timer.
     * 
     * This property is reactive; if this callback updates,
     * the timer's duration will update and the timer's time is fully reset.
    */
    durationSecs: () => number,
} & Partial<{
    /**
     * A snapshot to initialize the timer to (this determines the timer's time remaining and running status).
     * 
     * This property is reactive; if this callback updates,
     * the timer will seek to the specified time and running status.
     */
    snapshot: () => (TimerSnapshot | undefined),

    /**
     * This property can be bound to add an event handler for every time the timer's run state is changed.
     * 
     * @param running The updated running status of the timer
     * @param timeSincePause The time (in milliseconds) elapsed the last running period.
     */
    onRunningChange: (this: TimerState, running: boolean, timeSincePause: number) => void,
    /**
     * This property can be bound to an event handler when the total time elapsed changes
     * (so, every tick, essentially).
     * 
     * @param secsRemaining The new time remaining (in seconds)
     */
    onTimeChange: (this: TimerState, secsRemaining: number) => void,
    /**
     * This property can be bound to an event handler when the internal duration changes
     * (which occurs when `this.reset()` is invoked with a duration parameter).
     * 
     * @param durationSecs The new duration (in seconds)
     */
    onDurationChange: (this: TimerState, durationSecs: number) => void,
    /**
     * By default (false), the timer's effects are linked to the declared component's lifecycle.
     * 
     * If specified to `true`, this instead wraps the timer's effects in an `$effect.root(...)`,
     * meaning the effects are manually managed. To avoid effect errors, ensure that
     * `this.cleanupEffects` is invoked when the timer state is no longer in use
     * so that the effects are properly cleaned up.
     */
    root: boolean
}>;

/** @returns the elapsed time between the two time points. */
function getDelta(end: number, start?: number) {
    if (typeof start === "undefined") return 0;
    if (Number.isNaN(start)) return 0;
    if (Number.isNaN(end)) return 0;
    if (end < start) return 0;

    return Math.floor(end - start);
}

/**
 * A reactive timer.
 * 
 * This can be used any time a timer is needed.
 * It allows for playing, pausing, and resetting,
 * as well as tracking time elapsed.
 */
export class TimerState {
    #clock: ClockSource;
    #durationMs: number;

    #msRemainingAtPause: number;
    #lastStart: number | undefined;

    #msRemaining: number;
    #timeSincePause: number;
    #running: boolean;

    #onRunningChange?: TimerOptions["onRunningChange"];
    #onDurationChange?: TimerOptions["onDurationChange"];

    /**
     * Callback to cleanup rooted effects.
     * This has no effect if the TimerState was initialized with `root == false` (default).
     */
    cleanupEffects: () => void;

    constructor(clock: ClockSource, options: TimerOptions) {
        this.#clock = clock;

        // Load initial duration:
        const initDurationMs = 1000 * options.durationSecs();
        this.#durationMs = $state(initDurationMs);
        this.#msRemainingAtPause = $state(initDurationMs);
        this.#lastStart = $state();

        this.#onRunningChange = options.onRunningChange;
        this.#onDurationChange = options.onDurationChange;

        // For performance, don't trigger effect updates if result for these variables wouldn't change
        // (if these were just getters, they'd be updated every time the clock ticks)
        this.#timeSincePause = $derived(getDelta(this.#clock.tick, this.#lastStart));
        this.#msRemaining = $derived(clamp(this.#msRemainingAtPause - this.#timeSincePause, 0, Infinity));
        this.#running = $derived(typeof this.#lastStart !== "undefined");

        // EFfects for when msRemaining, duration, or snapshot update:
        const maybeRooted = (status: boolean | undefined, cb: () => void) =>
            status
                ? $effect.root(cb)
                : (cb(), () => { /* Do nothing on cleanup */ });
        this.cleanupEffects = maybeRooted(options.root, () => {
            watchEffect(options.durationSecs, secs => this.reset(secs));
            watchEffect(() => options.snapshot?.(), snapshot => snapshot && this.seek(snapshot));
            watchEffect(() => this.#msRemaining, ms => {
                options.onTimeChange?.call(this, ms / 1000);
    
                // Pauses timer when msRemaining is polled and it hits zero.
                if (ms <= 0) {
                    this.#setState(false);
                }
            });
        });
    }
    /** @returns the timer's current running snapshot. */
    snapshot(): TimerSnapshot {
        return {
            msRemainingAtPause: this.#msRemainingAtPause,
            lastStart: this.#lastStart
        };
    }
    /**
     * Moves the timer's current state to the snapshot.
     * 
     * This updates the timer's remaining time and running state.
     */
    seek(o: TimerSnapshot) {
        this.#msRemainingAtPause = o.msRemainingAtPause;
        this.#lastStart = o.lastStart;
    }

    /** @returns the timer's duration (in milliseconds) */
    get durationMs() {
        return this.#durationMs;
    }
    /** @returns the timer's duration (in seconds) */
    get durationSecs() {
        return this.durationMs / 1000;
    }
    /** @returns the time since the timer started running (in milliseconds) */
    get timeSincePause() {
        return this.#timeSincePause;
    }
    /** @returns the number of milliseconds remaining in the timer */
    get msRemaining() {
        return this.#msRemaining;
    }
    /** @returns the number of seconds remaining in the timer */
    get secsRemaining() {
        return this.msRemaining / 1000;
    }
    /** @returns the fraction of progress of the timer, in [0, 1],
     *     where 0 = fully complete, 1 = not yet started.
     */
    get progress() {
        return clamp(this.msRemaining / this.durationMs, 0, 1);
    }

    /** 
     * This function allows manual adjustments of the running status (and optionally the msRemaining variable)
     * without corrupting other variables (particularly `timeSincePause`).
    */
    #setState(newRunning: boolean, newMsRemaining?: number) {
        const oldRunning = this.#running;
        const timeSincePause = this.#timeSincePause;

        if (oldRunning == newRunning) {
            // If state is unchanged, all we need to do is update msRemaining.
            // If we're not running, msRemainingAtPause acts as the msRemaining time overall,
            //     so we can set msRemainingAtPause = newMsRemaining + 0 and be done.
            // If we're running, we need to maintain the time elapsed since pause,
            //     so we add that time to msRemainingAtPause.
            if (typeof newMsRemaining !== "undefined") {
                this.#msRemainingAtPause = newMsRemaining + timeSincePause;
            }
        } else {
            // If state changed, we either just "started" or "paused".
            // If we just started, we can update newMsRemaining and mark lastStart as beginning.
            // If we just paused, we need to update msRemainingAtPause to deduct runtime and mark lastStart as ending.
            this.#msRemainingAtPause = newMsRemaining ?? this.#msRemaining;
            this.#lastStart = newRunning ? this.#clock.tick : undefined;

            // Trigger change listener:
            this.#onRunningChange?.(newRunning, timeSincePause);
        }
    }

    /** @returns whether the timer is currently running */
    get running() {
        return this.#running;
    }
    /**
     * Sets the running status of the timer.
     * 
     * Note if the timer is elapsed, this may have no effect.
     */
    set running(status: boolean) {
        this.#setState(!this.isElapsed() && status);
    }
    /**
     * Toggles the running status.
     */
    toggleRunning() {
        this.running = !this.running;
    }

    /**
     * Set the milliseconds remaining.
     * @param newMsRemaining the milliseconds remaining
     * @param min a minimum time which the time cannot be under (optional)
     * @param max a maximum time which the time cannot exceed (optional)
     */
    setMsRemaining(newMsRemaining: number, min?: number, max?: number) {
        // If minimum provided, clamp to minimum
        if (typeof min === "number" && Number.isFinite(min)) {
            newMsRemaining = Math.max(newMsRemaining, min);
        }
        // If maximum provided, clamp to maximum
        if (typeof max === "number" && Number.isFinite(max)) {
            newMsRemaining = Math.min(newMsRemaining, max);
        }

        // If running, this will set msRemaining = newMsRemaining + tsPause - tsPause.
        // If not running, this will set msRemaining = newMsRemaining + 0.
        this.#msRemainingAtPause = newMsRemaining + this.timeSincePause;
    }
    /**
     * Adds the given amount of time (in seconds) to the current timer.
     * For example, if there is 0:30 left, and you call `timer.offsetDuration(1:00)`,
     * there would be `1:30` left.
     * 
     * @param deltaSecs Time to add in seconds
     * @param clampToMax If true, the new time will be capped to the maximum duration.
     */
    offsetDuration(deltaSecs: number, clampToMax = false) {
        return this.setMsRemaining(this.msRemaining + 1000 * deltaSecs, 0, clampToMax ? this.#durationMs : undefined);
    }
    /**
     * Resets the timer back to full progress.
     * 
     * @param durationSecs Special override parameter, which when specified, changes the internal duration 
     * of the timer state before applying the reset. This change can be listened to via the `onDurationChange`
     * callback specified during initialization.
     */
    reset(durationSecs?: number) {
        if (typeof durationSecs === "number" && durationSecs >= 0) {
            this.#durationMs = durationSecs * 1000;
            this.#onDurationChange?.(durationSecs);
        }
        this.#setState(false, this.#durationMs);
    }
    /**
     * Whether the timer can be reset at the moment.
     * A timer can only be reset when progress < 1.
     * 
     * @returns whether the timer can be reset
     */
    canReset() {
        return this.msRemaining !== this.#durationMs;
    }
    /** @returns whether the timer has completed its full time. */
    isElapsed() {
        return this.msRemaining <= 0;
    }

    shouldSave() {
        return this.canReset() && !this.isElapsed();
    }
}

type TArrayOptions = Partial<{
    /**
     * Callback which defines how the timers are synchronized.
     * 
     * If not specified, this defaults to "sync".
     */
    interact: () => TimerInteraction | undefined
}>

/**
 * Reactive array of timers.
 * 
 * When there are multiple timers, the timers may need to be synced,
 * and this class specially handles that functionality.
 */
export class TimerStateArray {
    #clock: ClockSource;
    #timers: TimerState[];
    #timerInteraction: TimerInteraction;
    
    /**
     * Creates a reactive array of timer states.
     * 
     * @param clock Clock source to bind all of the timers to.
     * @param timerOptions An array of initializing parameters for each timer.
     * @param arrayOptions Initializing options for the entire array.
     * @returns the timer array.
     */
    constructor(
        clock: ClockSource,
        timerOptions: TimerOptions[],
        arrayOptions?: TArrayOptions,
    ) {
        this.#clock = clock;
        this.#timers = $state(Array.from(timerOptions, (o, i) => this.#createTimer(o, i)));
        this.#timerInteraction = $derived(this.#timers.length >= 2
            ? arrayOptions?.interact?.() ?? "sync"
            : "sync"
        );
        
        // Destroy all effects when enclosing component dies:
        onDestroy(this.#cleanup);
    }

    #createTimer(options: TimerOptions, i: number): TimerState {
        const setRunning = (running: boolean) => this.#setRunning(i, running);
        return new TimerState(this.#clock, {
            ...options,
            onRunningChange(running, timeSincePause) {
                setRunning(running);
                options.onRunningChange?.call(this, running, timeSincePause);
            },
            root: true
        });
    }
    /**
     * Adds new timers to the array.
     */
    push(...els: TimerOptions[]) {
        const len = this.#timers.length;
        const newEls = Array.from(els, (o, i) => this.#createTimer(o, len + i));
        this.#timers.push(...newEls);
    }
    /**
     * Removes the last timer from the array.
     */
    pop() {
        this.#timers.pop()?.cleanupEffects();
    }
    #cleanup() {
        if (this) this.#timers.forEach(t => t.cleanupEffects());
    }
    /**
     * Removes all timers from the array.
     */
    clear() {
        this.#cleanup();
        this.#timers = [];
    }
    
    /**
     * Sets the running state of all timers associated with this array,
     * based on the sync state.
     */
    #setRunning(i: number, status: boolean) {
        let fillStates: TimerState[];

        const interact = this.#timerInteraction;
        if (interact === "sync") {
            fillStates = this.#timers;
        } else if (interact === "cascade") {
            fillStates = status
                ? this.#timers.slice(i)
                : this.#timers.slice(0, i + 1);
        } else if (interact === "none") {
            fillStates = [this.#timers[i]];
        } else {
            interact satisfies never;
            fillStates = [];
        }
        fillStates.forEach(t => t.running = status);
    }

    /**
     * Returns the current array of timers.
     * 
     * Note that this should only be used to access the timers,
     * not to rearrange elements, append new elements, or remove elements
     * (doing so may corrupt the state of the array).
     */
    get value() {
        return this.#timers;
    }
    /**
     * Returns the number of elements in the array.
     */
    get length() {
        return this.#timers.length;
    }
    
    /**
     * Gets the current timer interaction of the array.
     * 
     * Note that this may not be the same as the input timer interaction
     * (notably in cases where the input is not defined or there is a single timer in the array).
     */
    get timerInteraction() {
        return this.#timerInteraction;
    }
    
    /**
     * Get the specified timer.
     * 
     * This returns `undefined` if index is out-of-bounds.
     */
    get(i: number): TimerState | undefined {
        return this.#timers[i];
    }

    #mapIndices(indices?: number[]) {
        return indices && indices.length != 0
            ? indices.map<TimerState | undefined>(i => this.#timers[i])
            : this.#timers;
    }
    /**
     * Returns whether any of the timers can be reset.
     * @param indices the indices to check resettable status for
     *    (0 being the top/left-most and incrementing down/right).
     */
    canReset(indices?: number[]) {
        return this.#mapIndices(indices).some(t => t?.canReset());
    }
    /**
     * Resets a given set of timers.
     * @param indices the indices of the timers to reset
     *    (0 being the top/left-most and incrementing down/right).
     * 
     * **If no indices are provided, this instead resets all timers.**
     */
    reset(indices?: number[]) {
        this.#mapIndices(indices).forEach(t => t?.reset());
    }
}
