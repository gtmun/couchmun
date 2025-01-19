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
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { findDelegate, type Delegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import { lazyslide } from "$lib/util";
    import Icon from "@iconify/svelte";
    import Timer from "../Timer.svelte";
    import { untrack, type Snippet } from "svelte";

    interface Props {
        /**
         * The delegate array.
         */
        delegates: Delegate[]

        /**
         * The speakers list component (to implement logic for).
         */
        speakersList: SpeakerList | undefined,

        /**
         * The duration (in seconds) for the timers.
         * This prop also determines how many timers exist in this timer panel:
         * - If `duration` is a number, this creates 1 timer with the given value as the duration
         * - If `duration` is an array, then each element represents a timer with the element as the duration
         * 
         * If this timer panel is `editable`, then this is a **bindable** prop, 
         * in which case the duration is updated when the respective timer is edited.
         */
        duration: number | number[],

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
         * An optionally definable snippet. 
         * If defined, this replaces the default "Reset" button (which resets all timers)
         * with HTML content of your choice.
         */
        resetButtons?: Snippet<[typeof reset, typeof canReset]>,

        /**
         * Listener to reset events. Called when reset is called.
         */
        onBeforeReset?: (timers: (Timer | undefined)[]) => void
    }
    let {
        delegates,
        speakersList,
        duration = $bindable(),
        editable = false,
        timerInteraction: _ti = "sync",
        resetButtons = undefined,
        onBeforeReset = undefined
    }: Props = $props();

    // Creates a `timers` state with the specific number of timers.
    // This section is a bit jank because it has to handle the two formats for `duration`.
    const numTimers = () => duration instanceof Array ? duration.length : 1;
    let timers: (Timer | undefined)[] = $state(Array.from({ length: numTimers() }));

    // If only 1 timer, just treat this as sync regardless of setting.
    let timerInteraction = $derived(numTimers() < 2 ? "sync" : _ti);

    const numRunStates = () => timerInteraction == "sync" ? 1 : numTimers();
    let runStates = $state(Array.from({ length: numRunStates() }, () => false));

    $effect(() => {
        let nTimers = numTimers();
        untrack(() => {
            // When number of timers change, update the list of timers,
            // truncating any timer past the number of timers.
            timers.length = nTimers;
        });
    });
    $effect(() => {
        let nRunStates = numRunStates();
        untrack(() => {
            // When number of runnings change, update the list of runnings,
            // truncating any run states past the number of run states
            // and adding new `false`s for newly created run states.
            let oldLength = runStates.length;
            runStates.length = nRunStates;
            if (nRunStates > oldLength) {
                runStates.fill(false, oldLength);
            }
        })
    });

    // Getter/setter for duration, because there are two different formats for it.
    function getDuration(i: number): number {
        return typeof duration === "number" ? duration : duration[i];
    }
    function setDuration(i: number, d: number) {
        if (typeof duration === "number") {
            duration = d;
        } else {
            duration[i] = d;
        } 
    }
    
    // Getter/setter for run state, since it depends on timer interaction
    function getRunState(i: number): boolean {
        if (timerInteraction === "sync") {
            return runStates[0];
        } else if (timerInteraction === "cascade") {
            return runStates.slice(0, i + 1).some(s => s);
        } else if (timerInteraction === "none") {
            return runStates[i];
        } else {
            return timerInteraction satisfies never;
        }
    }
    function setRunState(i: number, s: boolean) {
        if (timerInteraction === "sync") {
            runStates[0] = s;
        } else if (timerInteraction === "cascade") {
            if (s) {
                runStates.fill(s, i);
            } else {
                runStates.fill(s, 0, i + 1);
            }
        } else if (timerInteraction === "none") {
            runStates[i] = s;
        } else {
            timerInteraction satisfies never;
        }
    }
    /**
     * Currently selected speaker from speakers list.
     */
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());
    /**
     * Whether timer at index `i` can be played.
     * @param i The index. If omitted, this function instead asserts that all timers are playable.
     * @return true if timer(s) can be played
     */
    function isTimerPlayable(i?: number): boolean {
        // If speaker is undefined, timer should not be startable.
        if (typeof selectedSpeaker === "undefined") return false;

        // If index provided, check the given timer for playability.
        // It should be playable if time has not elapsed.
        const timerPlayable = (t?: Timer) => typeof t !== "undefined" && !t.isElapsed();
        if (typeof i === "number") return timerPlayable(timers[i]);

        // If no index provided, all timers need to be playable.
        return timers.every(t => timerPlayable(t));
    }

    // If any timer starts, mark the current speaker as complete.
    $effect(() => {
        if (runStates.some(s => s)) untrack(() => {
            speakersList?.start();
        })
    });

    /**
     * Returns whether any of the timers can be reset.
     * @param indices the indices to check resettable status for
     *    (0 being the top/left-most and incrementing down/right).
     * 
     * **If no indices are provided, this instead resets all timers.**
     */
    export function canReset(...indices: number[]) {
        if (indices.length === 0) {
            return timers.some(t => t?.canReset());
        } else {
            return indices.some(i => timers[i]?.canReset());
        }
    }

    /**
     * Resets a given set of timers.
     * @param indices the indices of the timers to reset
     *    (0 being the top/left-most and incrementing down/right).
     * 
     * **If no indices are provided, this instead resets all timers.**
     */
    export function reset(...indices: number[]) {
        onBeforeReset?.(timers);
        if (indices.length === 0) {
            timers.forEach(t => t?.reset());
        } else {
            indices.forEach(i => timers[i]?.reset());
        }
    }
    function next() {
        speakersList?.next();
    }
</script>
<script module>
    export { resetButton };
</script>

<div class="flex justify-center h-6 lg:hidden">
    <!-- Placeholder which matches size of chevron-down -->
</div>
<div class="flex flex-col justify-center flex-grow">
    {#key selectedSpeaker?.key}
        <div class="pb-5" transition:lazyslide>
            {#if typeof selectedSpeaker !== "undefined"}
                <DelLabel attrs={findDelegate(delegates, selectedSpeaker.key)} />
            {/if}
        </div>
    {/key}
    <div class="flex flex-col gap-5">
        {#each timers as _, i}
            <!-- 
                This const is needed because the event handlers should 
                ONLY apply to 1 of the timers to avoid duplication.

                We bind it to the last.
            -->
            {@const last = i == timers.length - 1}
            <Timer
                name="timer-{i}"
                bind:duration={() => getDuration(i), d => setDuration(i, d)}
                bind:running={() => getRunState(i), s => setRunState(i, s)}
                bind:this={timers[i]}
                hidePlay={timerInteraction === "sync"}
                disablePlay={!isTimerPlayable(i)}
                useKeyHandlers={last}
                onPause={
                    last ? t => db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })
                         : undefined
                }
                {editable}
            />
        {/each}
        <!-- Button bar -->
        <div class="flex flex-row gap-3 justify-center">
            <!-- Global start/pause button: Only exists if timers are synchronized -->
            {#if timerInteraction === "sync"}
                <!-- If sync, it is assured that this is the only run state. -->
                {@const running = runStates[0]}
                <button 
                    class="btn variant-filled-primary"
                    disabled={!running && !isTimerPlayable()}
                    onclick={() => runStates[0] = !running}
                >
                    {running ? 'Pause' : 'Start'}
                </button>
            {/if}
            <!-- Next -->
            <button class="btn variant-filled-primary" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
            <!-- Reset (or the custom defined buttons) -->
            {#if resetButtons}
                {@render resetButtons(reset, canReset)}
            {:else}
                {@render resetButton(reset, canReset)}
            {/if}
        </div>
    </div>
</div>
<!-- Mobile chevron -->
<div class="flex justify-center lg:hidden">
    <Icon icon="mdi:chevron-down" width="24" height="24" />
</div>

<!-- 
  A basic reset button.
  @param reset The timer panel's reset callback (provided by the `resetButtons` snippet)
  @param canReset The timer panel's canReset callback (provided by the `resetButtons` snippet)
  @param label The text to write on this button
  @param indices Which indices to reset (or nothing, if we wish to apply to all timers)
-->
{#snippet resetButton(
    reset: (...indices: number[]) => void,
    canReset: (...indices: number[]) => boolean,
    label: string = "Reset",
    indices?: number[]
)}
    <button
        class="btn variant-filled-primary"
        disabled={!canReset(...(indices ?? []))}
        onclick={() => reset(...(indices ?? []))}
    >
        {label}
    </button>
{/snippet}