<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList, { createSpeaker } from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { db } from "$lib/db";
    import { findDelegate, updateDelegate } from "$lib/db/del";
    import { getSessionDataContext } from "$lib/stores/session";
    import type { AppBarData, Motion, Speaker } from "$lib/types";
    import { isPresent } from "$lib/util";
    import Icon from "@iconify/svelte";
    import { getContext, untrack } from "svelte";

    interface Props {
        motion: Motion & { kind: "rr" };
    }
    let { motion }: Props = $props();

    const { delegates } = getSessionDataContext();
    const appBarData = getContext<AppBarData>("app-bar");
    $effect(() => {
        appBarData.topic = `Topic: ${motion.topic}`;
    });

    // Timer
    let running: boolean = $state(false);
    let timer: Timer | undefined = $state();
    
    // Speakers List
    let speakersList: SpeakerList | undefined = $state();
    let order: Speaker[] = $state($delegates.filter(d => isPresent(d.presence)).map(d => createSpeaker(d.id)));
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
        <div class="flex justify-center h-6 lg:hidden">
            <!-- Placeholder which matches size of chevron-down -->
        </div>
        <div class="flex flex-col gap-5 justify-center flex-grow">
            {#if typeof selectedSpeaker !== "undefined"}
                <DelLabel attrs={findDelegate($delegates, selectedSpeaker.key)} />
            {/if}
            <Timer 
                name="total"
                duration={motion.speakingTime} 
                bind:this={timer}
                bind:running 
                disableKeyHandlers={typeof selectedSpeaker === "undefined"}
                onPause={(t) => updateDelegate(db.delegates, selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })}
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
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-[25rem] lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) updateDelegate(db.delegates, key, d => { d.stats.timesSpoken++; }) }}
        />
    </div>
</div>