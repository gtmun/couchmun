<!--
    @component The motion page for round robins, consisting of:
    - A header topic
    - A timer panel with a timer (delegate speaking time)
    - A speakers list that is automatically populated with all delegates
-->
<script lang="ts">
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import type { Motion, Speaker } from "$lib/types";
    import { stringifyTime } from "$lib/util/time";

    interface Props {
        motion: Motion & { kind: "rr" };
        order: Speaker[]
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    
    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();
    
    function reset() {
        timerPanel?.reset();
    }

    $effect(() => {
        if (timerPanel?.getRunState(0)) {
            let secs = timerPanel.secsRemaining(0);
            sessionData.tabTitleExtras = typeof secs !== "undefined" ? stringifyTime(secs) : undefined;
        } else {
            sessionData.tabTitleExtras = undefined;
        }
    });
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
            durations={[motion.speakingTime]}
            bind:this={timerPanel}
        />
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        >
            {#snippet controls()}{/snippet}
        </SpeakerList>
    </div>
</div>