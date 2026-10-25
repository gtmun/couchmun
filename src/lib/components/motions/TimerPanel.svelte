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
    import type { SessionDatabase } from "#lib/db/index.svelte.ts";
    import { lazyslide } from "#lib/util/index.js";
    import { TimerState, TimerStateArray } from "#lib/util/timer.svelte.ts";

    interface Props {
        /**
         * The speakers list component (to implement logic for).
         */
        speakersList?: SpeakerList;
        /**
         * Array of timers to display.
         */
        timerArray: TimerStateArray;
        /**
         * Same as Timer's `editable` prop: If enabled, the maximum duration for all timers is editable.
         */
        editable?: boolean;

        /**
         * Configurable additional controls.
         *
         * Each element indicates another button, with the specified string label.
         */
        extraControls?: {
            label: string;
            disabled: () => boolean;
            onclick: () => void;
        }[];

        /**
         * Property to format the delegate label.
         */
        label?: Snippet<[string]>;
    }
    let {
        speakersList,
        timerArray,
        editable = false,
        extraControls = [
            {
                label: "Reset",
                disabled: () => !timerArray.canReset(),
                onclick: () => timerArray.reset(),
            },
        ],
        label,
    }: Props = $props();

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
        return (
            typeof selectedSpeaker !== "undefined" &&
            timerArray.value.every((t) => !t.isElapsed())
        );
    }

    function next() {
        speakersList?.next();
    }
</script>

<script module lang="ts">
    export function onRunningChangeSL(running: boolean, timeSincePause: number, db: SessionDatabase, speakersList: SpeakerList | undefined) {
        if (!running) {
            const speaker = speakersList?.selectedSpeaker()?.key;
            return db.updateDelegate(speaker, d => { d.stats.durationSpoken += timeSincePause; });
        } else {
            speakersList?.start();
        }
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
        {#each timerArray.value as timer, i (timer)}
            <!-- 
                This const is needed because the event handlers should 
                ONLY apply to 1 of the timers to avoid duplication.

                We bind it to the last.
            -->
            {@const last = i == timerArray.length - 1}
            <Timer
                timerState={timer}
                hidePlay={timerArray.timerInteraction === "sync"}
                disablePlay={!isTimerPlayable(timer)}
                useKeyHandlers={last}
                {editable}
            />
        {/each}
        <!-- Button bar -->
        <div class="flex flex-row gap-2 justify-center">
            <!-- Global start/pause button: Only exists if timers are synchronized -->
            {#if timerArray.timerInteraction === "sync"}
                <!-- If sync, it is assured that this is the only run state. -->
                {const timer = $derived(timerArray.get(0)!)}
                <button
                    class="btn btn-lg preset-filled-primary-500"
                    disabled={!timer.running && !allTimersPlayable()}
                    onclick={() => timer.toggleRunning()}
                >
                    {timer.running ? "Pause" : "Start"}
                </button>
            {/if}
            <!-- Next -->
            <button
                class="btn btn-lg preset-filled-primary-500"
                disabled={speakersList?.isAllDone() ?? true}
                onclick={next}
            >
                Next
            </button>
            <!-- Reset Buttons -->
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each extraControls as { label, disabled, onclick }}
                <button
                    class="btn btn-lg preset-filled-primary-500"
                    disabled={disabled()}
                    {onclick}
                >
                    {label}
                </button>
            {/each}
        </div>
    </div>
</div>
