<!-- 
    @component A small timer component.
    This component consists of a linear progress bar and text displaying the timer's elapsed duration.
    
    To programatically control the timer, bind to the `running` prop of this component. 
    Setting it to `false` pauses the timer, and setting it to `true` starts the timer.
    The timer will automatically pause (setting `running` to false) when the full duration elapses.
-->
<script lang="ts">
    import { parseTime, stringifyTime } from "$lib/util/time";
    import { ProgressBar } from "@skeletonlabs/skeleton";
    import { onDestroy, onMount, untrack } from "svelte";
    
    interface Props {
        /**
         * How long the total duration of this timer should run for (in seconds).
         * 
         * If this timer is `editable`, then this is a **bindable** prop, 
         * in which case the duration is updated when the timer is edited.
         */
        duration: number;

        /**
         * The name of the timer. This should have some unique name per page.
         * It does not have to be descriptive; it could literally just be `1`.
         */
        name: string;

        /**
         * Whether or not this timer is running.
         * 
         * This is a **bindable** prop. It will update to reflect the timer's
         * running state. This can be set to start or pause the timer.
         * 
         * To reset the timer, use the `reset` function of the component.
         */
        running?: boolean;

        // Visual properties:
        /**
         * Any height classes that should be added to the progress bar.
         */
        height?: string;

        /**
         * If enabled, this removes the duration text. 
         * By default, this is false.
         */
        hideText?: boolean;

        // Other properties:
        /**
         * If enabled, the total duration part of the text can be modified to change the duration.
         * By default, this is false.
         */
        editable?: boolean;

        /**
         * If enabled, keyboard shortcuts to manage the timer are disabled. 
         * By default, this is false.
         */
        disableKeyHandlers?: boolean;

        /**
         * This property can be bound to add an event handler for every time the timer is paused.
         * 
         * The listener can accept a number representing the number of milliseconds since the last
         * pause.
         */
        onPause?: (elapsed: number) => void;
    }

    let {
        duration = $bindable(),
        name,
        running = $bindable(false),
        height = "h-10",
        hideText = false,
        editable = false,
        disableKeyHandlers = false,
        onPause = undefined,
    }: Props = $props();

    
    const COLOR_THRESHOLDS = [
        // color = the color class to apply
        // threshold = the maximum value needed for this color apply
        //     e.g., if (threshold_0 < progress <= threshold_1), we use color_1
        { color: "bg-emerald-500", threshold: 1   },
        { color: "bg-yellow-500",  threshold: 0.5 },
        { color: "bg-red-500",     threshold: 0.2 },
    ] as const;

    let DURATION_MS = $derived(duration * 1000);
    // reset timer on duration update:
    $effect(() => {
        duration;
        untrack(reset);
    });

    // Progress & display values
    let msRemaining = $state(duration * 1000);
    let progress = $derived(clamp(msRemaining / DURATION_MS, 0, 1))
    let color = $derived((COLOR_THRESHOLDS.findLast(t => progress <= t.threshold) ?? COLOR_THRESHOLDS[0]).color);
    let barProps = $derived({
        value: 100 * progress,
        height,
        transition: `duration-1000 ${running ? 'transition-[background-color]' : 'transition-[background-color,width]'}`,
        meter: color,
        track: "bg-surface-300-600-token",
        labelledby: `timer-text-${name}`
    });

    // Timer related handlers
    let lastStart: number | undefined = undefined;
    let lastEnd: number = 0;
    let msRemainingAtStart: number;

    // Timer event loop
    onMount(() => {
        initClockSource().addEventListener("message", loop);
    });
    onDestroy(() => {
        running = false;
        updateRunningEffects(running);
        clockSource?.removeEventListener("message", loop);
    });
    function loop({ data }: MessageEvent<ClockMessage>) {
        if (data.kind === "startTick") {
            if (!running) return;

            // Update msRemaining:
            lastStart ??= data.ts;
            lastEnd = data.ts;
            msRemaining = Math.max(0, msRemainingAtStart - Math.floor(lastEnd - lastStart));
        } else if (data.kind === "endTick") {
            // After all timers have been updated, update running:
            running = running && msRemaining > 0;
        } else {
            data satisfies never;
        }
    }

    // Trigger state update on running change:
    $effect(() => updateRunningEffects(running));

    // Exported methods:
    /**
     * Whether the timer can be reset at the moment.
     * It can be reset only when the duration is not at maximum.
     * @returns whether the timer can be reset
     */
    export function canReset(): boolean {
        return msRemaining != DURATION_MS;
    }
    /**
     * Resets the timer. 
     * This practically does nothing if `canReset()` is false.
     */
    export function reset() {
        running = false;
        msRemaining = DURATION_MS;
    }

    /**
     * Elapsed time since last pause.
     */
    function getElapsedTime() {
        if (typeof lastStart === "undefined") return 0;
        if (Number.isNaN(lastStart)) return 0;
        if (Number.isNaN(lastEnd)) return 0;
        if (lastEnd < lastStart) return 0;

        return lastEnd - lastStart;
    }
    
    function updateRunningEffects(running: boolean) {
        // Make sure that running does not depend on msRemaining 
        // (since that updates while running)
        untrack(() => {
            if (running) {
                lastStart = undefined;
                msRemainingAtStart = msRemaining;
            } else {
                onPause?.(getElapsedTime());
            }
        })
    }

    // Keyboard events
    function keydown(e: KeyboardEvent) {
        if (disableKeyHandlers) return;
        if (e.target !== document.body) return;

        if (!e.repeat) {
            if (e.code === "Enter") running = !running;
            if (e.code === "Space") running = true;
        }
    }
    function keyup(e: KeyboardEvent) {
        if (disableKeyHandlers) return;
        if (e.target !== document.body) return;

        if (e.code === "Space") running = false;
    }

    // Editable time:
    let totalTimeText: HTMLSpanElement | undefined = $state();
    function titleKeyDown(e: KeyboardEvent) {
        if (e.code === "Enter") {
            e.preventDefault();
            totalTimeText?.blur();
        }
    }
    function setDuration() {
        let text = totalTimeText?.textContent;
        let time = text ? parseTime(text) : undefined;
        duration = time ?? duration;
    }
</script>

<script module lang="ts">
    import type { ClockMessage } from "$lib/types";
    import { clamp } from "$lib/util";
    import ClockSourceWorker from "$lib/util/clock?worker";

    // This is a synchronized timer for all Timer components.
    // It is in a worker thread so that it runs in the background.
    // Every "tick", each timer connected to this clock source gets the same timestamp,
    // allowing them to be synchronized.
    let clockSource: Worker | undefined = undefined;
    function initClockSource(): Worker {
        return (clockSource ??= new ClockSourceWorker());
    }
</script>

<div class="flex flex-col gap-3">
    <h2 
        class="h2 text-center"
        class:hidden={hideText}
        id={barProps.labelledby}
    >
        {#if editable && !running}
            {stringifyTime(msRemaining / 1000)}/<span
                class="border-b-4 border-transparent hover:border-surface-500 focus:border-surface-500 transition rounded"
                contenteditable
                onfocusout={setDuration}
                onkeydown={titleKeyDown}
                bind:this={totalTimeText}
                role="none"
            >
                {stringifyTime(duration)}
            </span>
        {:else}
            {stringifyTime(msRemaining / 1000)}/{stringifyTime(duration)}
        {/if}
    </h2>
    <ProgressBar {...barProps} />
</div>

<svelte:window onkeydown={keydown} onkeyup={keyup} />