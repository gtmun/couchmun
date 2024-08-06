<!-- A small timer component.
    This component is a linear progress bar that runs for a preset number of seconds.
    This contains the binds bind:start, bind:pause, bind:reset to start/pause/reset the timer,
    and the duration prop to control how many seconds the timer should run for.
-->
<script lang="ts">
    import { ProgressBar } from "@skeletonlabs/skeleton";
    import { readonly, writable } from "svelte/store";

    export let duration: number;
    export let height: string = "h-5";
    export let border: string = "";
    export let running: boolean = false;

    $: DURATION_MS = duration * 1000;
    $: (DURATION_MS, reset()); // on duration update, reset timer
    
    const COLOR_THRESHOLDS = [
        ["bg-emerald-500", 1],
        ["bg-yellow-500",  0.5],
        ["bg-red-500",     0.2]
    ] as const;

    // Progress values
    let msRemaining = DURATION_MS;
    $: progress = clamp(msRemaining / DURATION_MS, 0, 1)
    $: color = (COLOR_THRESHOLDS.findLast(([_, n]) => msRemaining / DURATION_MS <= n) ?? COLOR_THRESHOLDS[0])[0];
    // Timer related handlers
    let lastStart: number | undefined = undefined;
    let msRemainingAtStart: number;

    // Readonly query variables:
    let _remStore = writable(msRemaining / 1000);
    $: $_remStore = msRemaining / 1000;
    export const secsRemaining = readonly(_remStore);

    async function nextAnimationFrame() {
        return new Promise<void>(resolve => {
            // Handle prerendering
            if (!("requestAnimationFrame" in globalThis)) return resolve();

            // Before the next frame is animated
            requestAnimationFrame(() => {
                // Before the frame after the next is animated (e.g., after the next frame is animated)
                requestAnimationFrame(() => resolve())
            })
        });
    }

    $: if (running) {
        msRemainingAtStart = msRemaining;
        lastStart = undefined;
        running = true;

        requestAnimationFrame(timerLoop);
    }
    export function reset() {
        running = false;

        // Wait until the frame completes before updating values.
        nextAnimationFrame().then(() => {
            msRemaining = DURATION_MS;
        });
    }

    function timerLoop(ts: number) {
        lastStart ??= ts;
        msRemaining = msRemainingAtStart - Math.floor(ts - lastStart);

        // Continue animating if time is not up
        running = running && msRemaining > 0;
        if (running) {
            requestAnimationFrame(timerLoop);
        }
    }
    function clamp(value: number, min: number, max: number) {
        if (Number.isNaN(value)) return max;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
</script>

<div class={border}>
    <ProgressBar 
        value={100 * progress}
        {height}
        transition="duration-1000 {running ? 'transition-[background-color]' : 'transition-[background-color,width]'}"
        meter="{color}"
        track="bg-surface-300-600-token"
    />
</div>