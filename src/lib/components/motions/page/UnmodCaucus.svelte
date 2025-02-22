<!--
    @component The motion page for unmoderated caucuses, consisting of:
    - A timer
-->
<script lang="ts">
    import Timer from "$lib/components/Timer.svelte";
    import type { Motion } from "$lib/types";
    
    interface Props {
        motion: Motion & { kind: "unmod" };
    }
    let { motion }: Props = $props();

    let timer: Timer | undefined = $state();
    let running: boolean = $state(false);
</script>

<div class="flex flex-col gap-5">
    <Timer
        duration={motion.totalTime}
        bind:this={timer}
        bind:running
    />
    <div class="flex flex-row gap-3 justify-center">
        <button class="btn variant-filled-primary" onclick={() => running = !running}>
            {!running ? 'Start' : 'Pause'}
        </button>
        <button class="btn variant-filled-primary" onclick={timer?.reset}>Reset</button>
    </div>
</div>