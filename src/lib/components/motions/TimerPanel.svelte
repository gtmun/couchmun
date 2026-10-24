<!-- 
  @component A component that wraps the entire panel where the timer 
  presides in the moderated caucus/round robin/speaker list/related pages.

  This panel consists of the following:
  - the delegate label (with flag + name)
  - 1 (or more) timers
  - a button bar for managing the timers

  This panel also automatically performs necessary logic between the timer
  and the speaker list and database stats.
-->
<script lang="ts">
    import { type Snippet } from "svelte";

    import DelLabel from "#lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import Timer from "#lib/components/Timer.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { db } from "#lib/db/index.svelte.js";
    import type { TimerSnapshot } from "#lib/types.js";
    import { lazyslide } from "#lib/util/index.js";
    import { createTimerArray, TimerState } from "#lib/util/timer.svelte.ts";

    interface Props {
        /**
         * The speakers list component (to implement logic for).
         */
        speakersList?: SpeakerList,

        /**
         * The duration (in seconds) for the timers.
         * This prop also determines how many timers exist in this timer panel.
         * The length of this array indicates how many timers exist in the array.
         * 
         * If this timer panel is `editable`, then this is a **bindable** prop, 
         * in which case the duration is updated when the respective timer is edited.
         */
        durations: number[],

        /**
         * Same as Timer's `editable` prop: If enabled, the maximum duration for all timers is editable.
         */
        editable?: boolean,

        /**
         * Indicates how timers interact with each other.
         * - If `"sync"`, timers have joined `running` properties. 
         *     If a timer starts or stops, then all timers stop.
         * - If `"cascade"`, timers have separate `running` properties, 
         *     but starting a timer will also start all timers after it,
         *     and pausing a timer will also pause all timers before it.
         * - If `"none"`, timers have separate `running` properties, 
         *     with no interactions between each other.
         */
        timerInteraction?: "sync" | "cascade" | "none",

        /**
         * Configurable reset buttons.
         * 
         * Each element indicates a reset button, with the specified string label
         * and which indices to reset. If `indices` is empty or undefined, then this resets all.
         */
        resetButtons?: {
            label: string,
            indices?: number[]
        }[],

        /**
         * Listener when duration updates.
         * This can only trigger if `editable` is true.
        */
        onDurationUpdate?: (i: number, duration: number) => void,

        /**
         * Listener to reset events. Called when reset is called.
         */
        onBeforeReset?: (timers: TimerState[]) => void,

        snapshots?: (TimerSnapshot | undefined)[],

        /**
         * Property to format the delegate label.
         */
        label?: Snippet<[string]>
    }
    let {
        speakersList,
        durations,
        editable = false,
        timerInteraction: _ti = "sync",
        resetButtons = [{ label: "Reset" }],
        onDurationUpdate,
        onBeforeReset = undefined,
        snapshots,
        label
    }: Props = $props();

    // Creates a `timers` state with the specific number of timers.
    const clock = getClockContext();
    const timers = createTimerArray(clock, 
        () => durations.length,
        i => ({
            durationSecs: () => durations[i],
            snapshot: () => snapshots?.[i],
            onRunningChange(running, timeSincePause) {
                const last = i == durations.length - 1;
                setRunState(i, running);
                if (last && !running) {
                    db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += timeSincePause; })
                }
            },
            onDurationChange(durationSecs) {
                return onDurationUpdate?.(i, durationSecs);
            }
        })
    );

    // If only 1 timer, just treat this as sync regardless of setting.
    let timerInteraction = $derived(timers.length < 2 ? "sync" : _ti);

    // Getter/setter for run state, since it depends on timer interaction
    export function getRunState(i: number): boolean {
        return timers[i].running;
    }
    function setRunState(i: number, s: boolean) {
        let fillStates: TimerState[];
        if (timerInteraction === "sync") {
            fillStates = timers;
        } else if (timerInteraction === "cascade") {
            fillStates = s
                ? timers.slice(i)
                : timers.slice(0, i + 1);
        } else if (timerInteraction === "none") {
            fillStates = [timers[i]];
        } else {
            timerInteraction satisfies never;
            fillStates = [];
        }
        fillStates.forEach(t => t.running = s);

        // If any timer starts, mark the current speaker as complete.
        if (s) {
            speakersList?.start();
        }
    }
    /**
     * Currently selected speaker from speakers list.
     */
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());

    function isTimerPlayable(timer: TimerState) {
        // A timer is playable if there's a speaker prepared and the timer has not elapsed.
        return typeof selectedSpeaker !== "undefined" && !timer.isElapsed();
    }
    function allTimersPlayable() {
        // All timers are playable if there's a speaker prepared and not every timer has elapsed.
        return typeof selectedSpeaker !== "undefined" && timers.every(t => !t.isElapsed());
    }

    function mapIndices(indices?: number[]) {
        return (indices ?? []).map<TimerState | undefined>(i => timers[i]);
    }
    /**
     * Returns whether any of the timers can be reset.
     * @param indices the indices to check resettable status for
     *    (0 being the top/left-most and incrementing down/right).
     */
    export function canReset(indices?: number[]) {
        let selectedTimers = mapIndices(indices);
        if (selectedTimers.length === 0) {
            selectedTimers = timers;
        }

        return selectedTimers.some(t => t?.canReset());
    }
    /**
     * Resets a given set of timers.
     * @param indices the indices of the timers to reset
     *    (0 being the top/left-most and incrementing down/right).
     * 
     * **If no indices are provided, this instead resets all timers.**
     */
    export function reset(indices?: number[]) {
        onBeforeReset?.(timers);

        let selectedTimers = mapIndices(indices);
        if (selectedTimers.length === 0) {
            selectedTimers = timers;
        }
        selectedTimers.forEach(t => t?.reset());
    }
    
    /**
     * @param timerIndex the index of the timer
     * @returns the seconds remaining for the timer of the given index
     */
    export function secsRemaining(timerIndex: number) {
        return timers[timerIndex]?.secsRemaining;
    }

    function next() {
        speakersList?.next();
    }
</script>

<div class="flex flex-col justify-center grow">
    {#key selectedSpeaker?.key}
        <div transition:lazyslide>
            {#if typeof selectedSpeaker !== "undefined"}
                <div class="pb-4">
                    <DelLabel attrs={selectedSpeaker.delegate} {label} />
                </div>
            {/if}
        </div>
    {/key}
    <div class="flex flex-col gap-4">
        {#each timers as timer, i (timer)}
            <!-- 
                This const is needed because the event handlers should 
                ONLY apply to 1 of the timers to avoid duplication.

                We bind it to the last.
            -->
            {@const last = i == timers.length - 1}
            <Timer
                timerState={timer}
                hidePlay={timerInteraction === "sync"}
                disablePlay={!isTimerPlayable(timer)}
                useKeyHandlers={last}
                {editable}
            />
        {/each}
        <!-- Button bar -->
        <div class="flex flex-row gap-2 justify-center">
            <!-- Global start/pause button: Only exists if timers are synchronized -->
            {#if timerInteraction === "sync"}
                <!-- If sync, it is assured that this is the only run state. -->
                {@const running = getRunState(0)}
                <button 
                    class="btn btn-lg preset-filled-primary-500"
                    disabled={!running && !allTimersPlayable()}
                    onclick={() => setRunState(0, !running)}
                >
                    {running ? 'Pause' : 'Start'}
                </button>
            {/if}
            <!-- Next -->
            <button class="btn btn-lg preset-filled-primary-500" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
            <!-- Reset Buttons -->
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each resetButtons as { indices, label }}
                <button
                    class="btn btn-lg preset-filled-primary-500"
                    disabled={!canReset(indices)}
                    onclick={() => reset(indices)}
                >
                    {label}
                </button>
            {/each}
        </div>
    </div>
</div>
