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
         * The running property for all timers.
         * This is a **bindable** prop.
         */
        running?: boolean,

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
         * An optionally definable snippet. 
         * If defined, this replaces the default "Reset" button (which resets all timers)
         * with HTML content of your choice.
         */
        resetButtons?: Snippet<[typeof reset, typeof canReset]>
    }
    let {
        delegates,
        speakersList,
        running = $bindable(false),
        duration = $bindable(),
        editable = false,
        resetButtons = undefined
    }: Props = $props();

    // Creates a `timers` state with the specific number of timers.
    // This section is a bit jank because it has to handle the two formats for `duration`.
    const numTimers = () => duration instanceof Array ? duration.length : 1;
    let timers = $state<(Timer | undefined)[]>(Array.from({ length: numTimers() }));
    $effect(() => {
        let nTimers = numTimers();
        if (nTimers != timers.length) {
            timers = Array.from({ length: nTimers });
        }
    });

    // Getter/setter for duration, because there are two different formats for it.
    function getDuration(i: number) {
        return typeof duration === "number" ? duration : duration[i];
    }
    function setDuration(i: number, d: number) {
        if (typeof duration === "number") {
            duration = d;
        } else {
            duration[i] = d;
        } 
    }
    
    /**
     * Currently selected speaker from speaker's list.
     */
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());
    /**
     * Whether timer can be started.
     * A timer can be started if there is a speaker the timer is bound to.
     */
    let timerNotStartable = $derived(typeof selectedSpeaker === "undefined");

    // If we switch to running, mark the current speaker as complete.
    $effect(() => {
        if (running) untrack(() => {
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
                bind:running
                bind:this={timers[i]}
                disableKeyHandlers={!last || timerNotStartable}
                onPause={
                    last ? t => db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })
                         : undefined
                }
                {editable}
            />
        {/each}
        <!-- Button bar -->
        <div class="flex flex-row gap-3 justify-center">
            <!-- Start/Pause -->
            <button 
                class="btn variant-filled-primary"
                disabled={!running && timerNotStartable}
                onclick={() => running = !running}
            >
                {running ? 'Pause' : 'Start'}
            </button>
            <!-- Next -->
            <button class="btn variant-filled-primary" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
            <!-- Reset (or the custom defined buttons) -->
            {@render (resetButtons ?? resetButton)(reset, canReset)}
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