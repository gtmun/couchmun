<!-- A small timer component.
    This component is a linear progress bar that runs for a preset number of seconds.
    This contains the binds bind:start, bind:pause, bind:reset to start/pause/reset the timer,
    and the duration prop to control how many seconds the timer should run for.
-->
<script lang="ts">
    import { parseTime, stringifyTime } from "$lib/util/time";
    import { ProgressBar } from "@skeletonlabs/skeleton";
    import { onDestroy, onMount } from "svelte";
    
    interface Props {
        duration: number;
        name: string;
        height?: string;
        running?: boolean;
        hideText?: boolean;
        disableKeyHandlers?: boolean;
        editable?: boolean;
        onPause?: ((elapsed: number) => void) | undefined;
    }

    let {
        duration = $bindable(),
        name,
        height = "h-10",
        running = $bindable(false),
        hideText = false,
        disableKeyHandlers = false,
        editable = false,
        onPause = undefined
    }: Props = $props();

    
    const COLOR_THRESHOLDS = [
        ["bg-emerald-500", 1],
        ["bg-yellow-500",  0.5],
        ["bg-red-500",     0.2]
    ] as const;

    let DURATION_MS = $derived(duration * 1000);
    // reset timer on duration update:
    $effect(() => {
        duration;
        reset();
    });

    // Progress & display values
    let msRemaining = $state(duration * 1000);
    let progress = $derived(clamp(msRemaining / DURATION_MS, 0, 1))
    let color = $derived((COLOR_THRESHOLDS.findLast(([_, n]) => progress <= n) ?? COLOR_THRESHOLDS[0])[0]);
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
    onMount(() => {
        initClockSource().addEventListener("message", loop);
    });
    onDestroy(() => {
        running = false;
        updateRunningEffects(running);
        clockSource?.removeEventListener("message", loop);
    });

    // Trigger state update on running change:
    $effect(() => {
        updateRunningEffects(running);
    });

    // Readonly query variables:
    export function secsRemaining(): number {
        return msRemaining / 1000;
    }
    export function canReset(): boolean {
        return secsRemaining() != duration;
    }
    
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
    
    // You have to check for a state change here, idk why
    let _running = running;
    function updateRunningEffects(running: boolean) {
        if (_running != running) {
            _running = running;
            if (running) {
                lastStart = undefined;
                msRemainingAtStart = msRemaining;
            } else {
                onPause?.(getElapsedTime());
            }
        }
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
            {stringifyTime(secsRemaining())}/<span
                contenteditable
                onfocusout={setDuration}
                onkeydown={titleKeyDown}
                bind:this={totalTimeText}
                role="none"
            >
                {stringifyTime(duration)}
            </span>
        {:else}
            {stringifyTime(secsRemaining())}/{stringifyTime(duration)}
        {/if}
    </h2>
    <ProgressBar {...barProps} />
</div>

<svelte:window onkeydown={keydown} onkeyup={keyup} />