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
    import { untrack, type Snippet } from "svelte";

    import Timer from "../Timer.svelte";

    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { findDelegate, type Delegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import { lazyslide } from "$lib/util";
    import MdiChevronDown from "~icons/mdi/chevron-down";

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
        onDurationUpdate?: (durations: number[]) => void,

        /**
         * Listener to reset events. Called when reset is called.
         */
        onBeforeReset?: (timers: (Timer | undefined)[]) => void,

        /**
         * Property to format the delegate label.
         */
        label?: Snippet<[string]>
    }
    let {
        delegates,
        speakersList,
        durations: dur,
        editable = false,
        timerInteraction: _ti = "sync",
        resetButtons = [{ label: "Reset" }],
        onDurationUpdate,
        onBeforeReset = undefined,
        label
    }: Props = $props();

    // Creates a `timers` state with the specific number of timers.
    let durations = $derived(dur);
    const numTimers = () => durations.length;
    let timers: (Timer | undefined)[] = $state(Array.from({ length: numTimers() }));
    let runStates: boolean[] = $state(Array.from({ length: numTimers() }, () => false));

    // If only 1 timer, just treat this as sync regardless of setting.
    let timerInteraction = $derived(numTimers() < 2 ? "sync" : _ti);

    $effect(() => {
        let nTimers = numTimers();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        timerInteraction;

        untrack(() => {
            // When number of timers change, update the list of timers,
            // truncating any timer past the number of timers.
            timers.length = nTimers;
            // When number of runnings change, update the list of runnings,
            // and pause all timers.
            runStates.length = nTimers;
            runStates.fill(false);
        });
    });
    
    // If any timer starts, mark the current speaker as complete.
    $effect(() => {
        if (runStates.some(s => s)) untrack(() => {
            speakersList?.start();
        })
    });

    // Getter/setter for run state, since it depends on timer interaction
    export function getRunState(i: number): boolean {
        return runStates[i];
    }
    function setRunState(i: number, s: boolean) {
        if (timerInteraction === "sync") {
            runStates.fill(s);
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
     * @param timerIndex the index of the timer
     * @returns the seconds remaining for the timer of the given index
     */
    export function secsRemaining(timerIndex: number) {
        return timers[timerIndex]?.secsRemaining?.();
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

<div class="flex justify-center h-6 lg:hidden">
    <!-- Placeholder which matches size of chevron-down -->
</div>
<div class="flex flex-col justify-center grow">
    {#key selectedSpeaker?.key}
        <div transition:lazyslide>
            {#if typeof selectedSpeaker !== "undefined"}
                <div class="pb-5">
                    <DelLabel attrs={findDelegate(delegates, selectedSpeaker.key)} {label} />
                </div>
            {/if}
        </div>
    {/key}
    <div class="flex flex-col gap-5">
        <!-- HACK: Each timer depends on its index, so key isn't required -->
        <!-- eslint-disable-next-line svelte/require-each-key -->
        {#each timers as _, i}
            <!-- 
                This const is needed because the event handlers should 
                ONLY apply to 1 of the timers to avoid duplication.

                We bind it to the last.
            -->
            {@const last = i == timers.length - 1}
            <Timer
                bind:duration={
                    () => durations[i],
                    d => {durations[i] = d; onDurationUpdate?.(durations)}
                }
                running={getRunState(i)}
                bind:this={timers[i]}
                hidePlay={timerInteraction === "sync"}
                disablePlay={!isTimerPlayable(i)}
                useKeyHandlers={last}
                onRunningChange={(running, t) => {
                    setRunState(i, running);
                    if (last && !running) {
                        db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })
                    }
                }}
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
                    class="btn preset-filled-primary-500"
                    disabled={!running && !isTimerPlayable()}
                    onclick={() => runStates[0] = !running}
                >
                    {running ? 'Pause' : 'Start'}
                </button>
            {/if}
            <!-- Next -->
            <button class="btn preset-filled-primary-500" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
            <!-- Reset Buttons -->
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each resetButtons as { indices, label }}
                <button
                    class="btn preset-filled-primary-500"
                    disabled={!canReset(...(indices ?? []))}
                    onclick={() => reset(...(indices ?? []))}
                >
                    {label}
                </button>
            {/each}
        </div>
    </div>
</div>
<!-- Mobile chevron -->
<div class="flex justify-center lg:hidden">
    <MdiChevronDown />
</div>
