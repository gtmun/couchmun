<!--
    @component The motion page for moderated caucuses, consisting of:
    - A header topic
    - A timer panel with two timers (delegate and total time)
    - An editable speakers list
-->
<script lang="ts">
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import type Timer from "$lib/components/Timer.svelte";
    import TimerPanel, { resetButton } from "$lib/components/motions/TimerPanel.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import type { Motion, Speaker } from "$lib/types";

    interface Props {
        motion: Motion & { kind: "mod" };
        order: Speaker[];
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates, preferences } = sessionData;

    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();

    /**
     * Resets the delegate timer. It also does not trigger the effect if there was no speaker
     * (in which case a reset doesn't really need to happen).
     */
    function resetDel(oldSpeaker?: Speaker) {
        if (typeof oldSpeaker !== "undefined") timerPanel?.reset(0);
    }
    /**
     * Deduct time from the total timer if that setting is enabled.
     */
    function deductTime([delTimer, totalTimer]: (Timer | undefined)[]) {
        if ($preferences.yieldMainTimer) return;
        if (!delTimer || !totalTimer) return;
        totalTimer.offsetDuration(-delTimer.secsRemaining());
    }
</script>

<div class="flex flex-col lg:flex-row h-full gap-8 items-stretch">
    <!--
        Under mobile, the timer encompasses the whole page 
        and the speakers list can be accessed by scrolling down.

        Under desktop, both are on the same screen,
        with the left side being the timer and the right side being the speakers list.
    -->
    <!-- Left/Top -->
    <div class="flex flex-col grow shrink-0 basis-full lg:basis-auto">
        <TimerPanel
            delegates={$delegates}
            {speakersList}
            duration={[motion.speakingTime, motion.totalTime]}
            timerInteraction={$preferences.pauseMainTimer ? "sync" : "cascade"}
            onBeforeReset={deductTime}
            bind:this={timerPanel}
        >
        {#snippet resetButtons(reset, canReset)}
            {@render resetButton(reset, canReset, "Reset", [0])}
            {@render resetButton(reset, canReset, "Reset All")}
        {/snippet}
        </TimerPanel>
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={resetDel}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        />
    </div>
</div>