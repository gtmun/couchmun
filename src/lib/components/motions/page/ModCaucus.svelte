<!--
    @component The motion page for moderated caucuses, consisting of:
    - A header topic
    - A timer panel with two timers (delegate and total time)
    - An editable speakers list
-->
<script lang="ts">
    import SpeakerList from "$lib/components/SpeakerList.svelte";
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
    $effect(() => {
        sessionData.barTopic = `Topic: ${motion.topic}`;
    });

    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();

    function resetOne() {
        timerPanel?.reset(0);
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
    <div class="flex flex-col flex-grow flex-shrink-0 basis-full lg:basis-auto">
        <TimerPanel
            delegates={$delegates}
            {speakersList}
            duration={[motion.speakingTime, motion.totalTime]}
            timerInteraction={$preferences.pauseMainTimer ? "sync" : "cascade"}
            bind:this={timerPanel}
        >
        {#snippet resetButtons(reset, canReset)}
            {@render resetButton(reset, canReset, "Reset", [0])}
            {@render resetButton(reset, canReset, "Reset All")}
        {/snippet}
        </TimerPanel>
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-[25rem] lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={resetOne}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        />
    </div>
</div>