<!--
    @component The motion page for unmoderated caucuses, consisting of:
    - A timer
-->
<script lang="ts">
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import type { Motion } from "$lib/types";
    
    interface Props {
        motion: Motion & { kind: "unmod" };
    }
    let { motion }: Props = $props();

    const sessionData = getSessionContext();
    let timer: Timer | undefined = $state();
    let running: boolean = $state(false);
</script>

<div class="flex flex-col gap-5">
    <Timer
        duration={motion.totalTime}
        bind:this={timer}
        {running}
        onRunningChange={r => {
            running = r;
            sessionData.updateTabTitleExtras(r, timer?.secsRemaining?.());
        }}
        onTimeChange={msElapsed => sessionData.updateTabTitleExtras(running, msElapsed / 1000)}
    />
    <div class="flex flex-row gap-3 justify-center">
        <button class="btn preset-filled-primary-500" onclick={() => running = !running}>
            {!running ? 'Start' : 'Pause'}
        </button>
        <button class="btn preset-filled-primary-500" onclick={timer?.reset}>Reset</button>
    </div>
</div>