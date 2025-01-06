<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import type { Motion, Speaker } from "$lib/types";
    import Icon from "@iconify/svelte";
    import { untrack } from "svelte";

    interface Props {
        motion: Motion & { kind: "mod" };
        order: Speaker[];
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    $effect(() => {
        sessionData.barTopic = `Topic: ${motion.topic}`;
    });

    // Timer
    let running: boolean = $state(false);
    let delTimer: Timer | undefined = $state();
    let totalTimer: Timer | undefined = $state();
    
    // Speakers List
    let speakersList: SpeakerList | undefined = $state();
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());
    $effect(() => {
        if (running) untrack(() => {
            speakersList?.start();
        })
    });

    // Button triggers
    function reset() {
        delTimer?.reset();
    }
    function resetAll() {
        delTimer?.reset();
        totalTimer?.reset();
    }
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
                name="delegate"
                duration={motion.speakingTime}
                bind:this={delTimer}
                bind:running
                disableKeyHandlers={typeof selectedSpeaker === "undefined"}
                onPause={(t) => db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })}
            />
            <Timer
                name="total"
                duration={motion.totalTime}
                bind:this={totalTimer}
                bind:running
                disableKeyHandlers
            />
            <div class="flex flex-row gap-3 justify-center">
                {#if !running}
                    <button class="btn variant-filled-primary" disabled={typeof selectedSpeaker === "undefined"} onclick={() => running = true}>Start</button>
                {:else}
                    <button class="btn variant-filled-primary" onclick={() => running = false}>Pause</button>
                {/if}
                <button class="btn variant-filled-primary" disabled={speakersList?.isAllDone() ?? true} onclick={next}>Next</button>
                <button class="btn variant-filled-primary" disabled={!delTimer?.canReset()} onclick={reset}>Reset</button>
                <button class="btn variant-filled-primary" disabled={!totalTimer?.canReset()} onclick={resetAll}>Reset all</button>
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
            useDefaultControls={{
                validator: presentDelegateSchema
            }}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        />
    </div>
</div>