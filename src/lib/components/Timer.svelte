<!-- A small timer component.
    This component is a linear progress bar that runs for a preset number of seconds.
    This contains the binds bind:start, bind:pause, bind:reset to start/pause/reset the timer,
    and the duration prop to control how many seconds the timer should run for.
-->
<script lang="ts">
    import { parseTime, stringifyTime } from "$lib/util/time";
    import { ProgressBar } from "@skeletonlabs/skeleton";
    import { onDestroy, onMount } from "svelte";
    import { readonly, writable } from "svelte/store";
    
    export let duration: number;
    export let name: string; // Label for the timer. Must be unique between timers in the same page.
    export let height: string = "h-10";
    export let running: boolean = false;
    export let hideText: boolean = false;
    export let disableKeyHandlers: boolean = false;
    export let editable: boolean = false;
    export let onPause: ((elapsed: number) => void) | undefined = undefined;

    $: DURATION_MS = duration * 1000;
    $: (DURATION_MS, reset()); // on duration update, reset timer
    
    const COLOR_THRESHOLDS = [
        ["bg-emerald-500", 1],
        ["bg-yellow-500",  0.5],
        ["bg-red-500",     0.2]
    ] as const;

    // Progress & display values
    let msRemaining = DURATION_MS;
    $: progress = clamp(msRemaining / DURATION_MS, 0, 1)
    $: color = (COLOR_THRESHOLDS.findLast(([_, n]) => progress <= n) ?? COLOR_THRESHOLDS[0])[0];
    $: barProps = {
        value: 100 * progress,
        height,
        transition: `duration-1000 ${running ? 'transition-[background-color]' : 'transition-[background-color,width]'}`,
        meter: color,
        track: "bg-surface-300-600-token",
        labelledby: `timer-text-${name}`
    }
    // Timer related handlers
    let lastStart: number | undefined = undefined;
    let lastEnd: number = 0;
    let msRemainingAtStart: number;
    onMount(() => {
        initClockSource().addEventListener("message", loop);
    });
    onDestroy(() => {
        running = false;
        clockSource?.removeEventListener("message", loop);
    });

    // Only trigger state update if running state changed:
    let _running = running;
    $: if (_running != running) {
        _running = running;
        if (running) {
            lastStart = undefined;
            msRemainingAtStart = msRemaining;
        } else {
            onPause?.(getElapsedTime());
        }
    }

    // Readonly query variables:
    let _remStore = writable(msRemaining / 1000);
    $: $_remStore = msRemaining / 1000;
    export const secsRemaining = readonly(_remStore);

    let _rsStore = writable(false);
    $: $_rsStore = $secsRemaining !== duration;
    export const canReset = readonly(_rsStore);

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
    export function reset() {
        running = false;
        msRemaining = DURATION_MS;
    }
    function getElapsedTime() {
        if (typeof lastStart === "undefined") return 0;
        if (Number.isNaN(lastStart)) return 0;
        if (Number.isNaN(lastEnd)) return 0;
        if (lastEnd < lastStart) return 0;

        return lastEnd - lastStart;
    }

    function clamp(value: number, min: number, max: number) {
        if (Number.isNaN(value)) return max;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

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
    let totalTimeText: HTMLSpanElement;
    function titleKeyDown(e: KeyboardEvent) {
        if (e.code === "Enter") {
            totalTimeText?.blur();
        }
    }
    function setDuration() {
        let text = totalTimeText.textContent;
        let time = text ? parseTime(text) : undefined;
        duration = time ?? duration;
    }
</script>

<script context="module" lang="ts">
    import type { ClockMessage } from "$lib/types";
    import ClockSourceURL from "$lib/util/clock?url";

    // This is a synchronized timer for all Timer components.
    // It is in a worker thread so that it runs in the background.
    // Every "tick", each timer connected to this clock source gets the same timestamp,
    // allowing them to be synchronized.
    let clockSource: Worker | undefined = undefined;
    function initClockSource(): Worker {
        return (clockSource ??= new Worker(ClockSourceURL));
    }
</script>

<div class="flex flex-col gap-3">
    <h2 
        class="h2 text-center"
        class:hidden={hideText}
        id={barProps.labelledby}
    >
        {#if editable && !running}
            {stringifyTime($secsRemaining)}/<span
                contenteditable
                on:focusout={setDuration}
                on:keydown={titleKeyDown}
                bind:this={totalTimeText}
                role="none"
            >
                {stringifyTime(duration)}
            </span>
        {:else}
            {stringifyTime($secsRemaining)}/{stringifyTime(duration)}
        {/if}
    </h2>
    <ProgressBar {...barProps} />
</div>

<svelte:window on:keydown={keydown} on:keyup={keyup} />