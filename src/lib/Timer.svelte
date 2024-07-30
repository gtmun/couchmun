<!-- A small timer component.
    This component is a linear progress bar that runs for a preset number of seconds.
    This contains the binds bind:start, bind:pause, bind:reset to start/pause/reset the timer,
    and the duration prop to control how many seconds the timer should run for.
-->
<script lang="ts">
    export let duration: number;

    const DURATION_MS = duration * 1000;

    let msRemaining = DURATION_MS;
    let lastTs: number;
    let callId: number | undefined = undefined;
    let running: boolean = false;

    let bar: HTMLDivElement;
    let color = "green";

    export function start() {
        pause();
        lastTs = performance.now();
        callId = requestAnimationFrame(timerLoop);
    }
    export function pause() {
        if (typeof callId === "number") {
            cancelAnimationFrame(callId);
        }
        callId = undefined;
    }
    export function reset() {
        pause();
        msRemaining = DURATION_MS;
    }

    function timerLoop() {
        let currentTs = performance.now();
        msRemaining -= Math.floor(currentTs - lastTs);
        lastTs = currentTs;

        // Continue animating if time is not up
        if (msRemaining > 0) {
            callId = requestAnimationFrame(timerLoop);
        } else {
            callId = undefined;
        }
    }
    function timeString(ms: number): string {
        if (ms < 0) ms = 0;
        let secsElapsed = Math.ceil(ms / 1000);

        let sec = secsElapsed % 60;
        let min = Math.floor(secsElapsed / 60);
        let hr;
        let day;

        if (min >= 60) {
            hr = Math.floor(min / 60);
            min %= 60;

            if (hr >= 24) {
                day = Math.floor(hr / 24);
                hr %= 24;
            }
        }
        
        return [day, hr, min, sec]
            .filter(n => typeof n != "undefined")
            .map(n => String(n).padStart(2, '0'))
            .join(':');
    }
    function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(min, value), max)
    }
    
    $: bar?.style.setProperty("--progress", String(clamp(msRemaining / DURATION_MS, 0, 1)));
    $: {
        if (msRemaining <= 0.2 * DURATION_MS) color = "red";
        else if (msRemaining <= 0.5 * DURATION_MS) color = "yellow";
        else color = "green";
    }
    $: running = typeof callId !== "undefined";
</script>
<style>
    .top {
        display: flex;
        flex-direction: column;

        border: 1px solid black;
    }
    .bar {
        width: calc(100% * var(--progress));
        height: 20px;
        background-color: green;
        transition: background-color 1s;
    }
    .time {
        align-self: center;
    }

    .bar.yellow {
        background-color: goldenrod;
    }
    .bar.red {
        background-color: red;
    }
    .bar:not(.running) {
        /* If running, we don't want to use a width transition as that would interfere with the JS animation */
        transition: background-color 1s, width 1s;
    }
</style>

<div class="top">
    <div class="bar" bind:this={bar} class:yellow={color === "yellow"} class:red={color === "red"} class:running></div>
    <div class="time">{timeString(msRemaining)}/{timeString(DURATION_MS)}</div>
</div>