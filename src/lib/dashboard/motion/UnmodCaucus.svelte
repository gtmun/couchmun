<script lang="ts">
    import type { Motion } from "$lib/dashboard/types";
    import { stringifyTime } from "$lib/time";
    import Timer from "$lib/Timer.svelte";
    import { type Readable } from "svelte/store";

    export let motion: Motion & { kind: "unmod" };

    let timer: Timer;
    let secsRemaining: Readable<number>;
    let running: boolean = false;
    $: duration = motion?.totalTime ?? 0;
</script>

<div class="flex flex-col gap-5">
    <h2 class="h2 text-center">{stringifyTime($secsRemaining)}/{stringifyTime(duration)}</h2>
    <Timer
        {duration}
        bind:this={timer}
        bind:secsRemaining
        bind:running
        height="h-10"
    />
    <div class="flex flex-row gap-3 justify-center">
        <button class="btn variant-filled-primary" on:click={() => running = !running}>
            {!running ? 'Start' : 'Pause'}
        </button>
        <button class="btn variant-filled-primary" on:click={timer.reset}>Reset</button>
    </div>
</div>