<!--
    @component The motion page for unmoderated caucuses, consisting of:
    - A timer
-->
<script lang="ts">
    import Timer from "#lib/components/Timer.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import type { Motion } from "#lib/types.d.ts"
    import { TimerState } from "#lib/util/timer.svelte.ts";
    
    interface Props {
        motion: Motion & { kind: "unmod" };
    }
    let { motion }: Props = $props();
    
    const sessionData = getSessionContext();

    const timer = new TimerState(getClockContext(), {
        durationSecs: () => motion.totalTime,
        onRunningChange(running) {
            sessionData.updateTabTitleExtras(running, this.secsRemaining);
        },
        onTimeChange(secsRemaining) {
            sessionData.updateTabTitleExtras(this.running, secsRemaining);
        },
        onDurationChange(durationSecs) {
            motion.totalTime = durationSecs;
        }
    });
</script>

<div class="flex flex-col gap-5">
    <Timer timerState={timer} />
    <div class="flex flex-row gap-3 justify-center">
        <button class="btn preset-filled-primary-500" onclick={() => timer.toggleRunning()}>
            {!timer.running ? 'Start' : 'Pause'}
        </button>
        <button class="btn preset-filled-primary-500" onclick={() => timer.reset()}>Reset</button>
    </div>
</div>
