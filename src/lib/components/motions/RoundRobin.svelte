<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList, { createSpeaker } from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import { getStatsContext, updateStats } from "$lib/stores/stats";
    import type { AppBarData, Motion, Speaker } from "$lib/types";
    import Icon from "@iconify/svelte";
    import { getContext, untrack } from "svelte";

    interface Props {
        motion: Motion & { kind: "rr" };
    }
    let { motion }: Props = $props();

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();
    const { stats } = getStatsContext();
    const appBarData = getContext<AppBarData>("app-bar");
    $effect(() => {
        appBarData.topic = motion.topic;
    });

    // Timer
    let running: boolean = $state(false);
    let timer: Timer | undefined = $state();
    
    // Speakers List
    let speakersList: SpeakerList | undefined = $state();
    let order: Speaker[] = $state($presentDelegates.map(key => createSpeaker(key)));
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());
    $effect(() => {
        if (running) untrack(() => {
            speakersList?.start();
        })
    });
    
    function reset() {
        timer?.reset();
    }
    // Button triggers
    function next() {
        speakersList?.next();
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
        <div class="flex flex-col gap-5 justify-center flex-grow">
            {#if typeof selectedSpeaker !== "undefined"}
                <DelLabel key={selectedSpeaker.key} attrs={$delegateAttributes[selectedSpeaker.key]} />
            {/if}
            <Timer 
                name="total"
                duration={motion.speakingTime} 
                bind:this={timer}
                bind:running 
                disableKeyHandlers={typeof selectedSpeaker === "undefined"}
                onPause={(t) => updateStats(stats, selectedSpeaker?.key, dat => dat.durationSpoken += t)}
            />
            <div class="flex flex-row gap-3 justify-center">
                {#if !running}
                    <button class="btn variant-filled-primary" disabled={typeof selectedSpeaker === "undefined"} onclick={() => running = true}>Start</button>
                {:else}
                    <button class="btn variant-filled-primary" onclick={() => running = false}>Pause</button>
                {/if}
                <button class="btn variant-filled-primary" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
                <button class="btn variant-filled-primary" disabled={!timer?.canReset()} onclick={reset}>Reset</button>
            </div>
        </div>
        <!-- Mobile chevron -->
        <div class="flex justify-center lg:hidden">
            <Icon icon="mdi:chevron-down" width="24" height="24" />
        </div>
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegateAttributes}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) updateStats(stats, key, dat => dat.timesSpoken++) }}
        />
    </div>
</div>