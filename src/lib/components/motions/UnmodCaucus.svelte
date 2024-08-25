<script lang="ts">
    import Timer from "$lib/components/Timer.svelte";
    import type { Motion } from "$lib/types";
    
    export let motion: Motion & { kind: "unmod" };

    let timer: Timer;
    let running: boolean = false;
</script>

<div class="flex flex-col gap-5">
    <Timer
        duration={motion.totalTime}
        bind:this={timer}
        bind:running
    />
    <div class="flex flex-row gap-3 justify-center">
        <button class="btn variant-filled-primary" on:click={() => running = !running}>
            {!running ? 'Start' : 'Pause'}
        </button>
        <button class="btn variant-filled-primary" on:click={timer.reset}>Reset</button>
    </div>
</div>