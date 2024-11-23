<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { getSessionDataContext } from "$lib/stores/session";
    import { getStatsContext, updateStats } from "$lib/stores/stats";
    import type { AppBarData, Motion, Speaker } from "$lib/types";
    import { getContext, tick, untrack } from "svelte";

    interface Props {
        motion: Motion & { kind: "mod" };
    }
    let { motion }: Props = $props();

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();
    const { stats } = getStatsContext();
    const appBarData = getContext<AppBarData>("app-bar");
    $effect(() => {
        appBarData.topic = motion.topic;
    })

    // Timer
    let running: boolean = $state(false);
    let delTimer: Timer | undefined = $state();
    let totalTimer: Timer | undefined = $state();
    
    // Speakers List
    let speakersList: SpeakerList | undefined = $state();
    let order: Speaker[] = $state([]);
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());
    $effect(() => {
        selectedSpeaker;
        reset();
    });
    $effect(() => {
        if (running) untrack(() => {
            speakersList?.start();
        })
    });

    // Button triggers
    async function reset() {
        delTimer?.reset();
        await tick();
    }
    async function resetAll() {
        delTimer?.reset();
        totalTimer?.reset();
        await tick();
    }
    async function next() {
        await reset();
        speakersList?.next();
    }
</script>

<div class="grid grid-cols-[2fr_1fr] gap-12 h-full">
    <!-- Left -->
    <div class="flex flex-col gap-5 self-center">
        {#if typeof selectedSpeaker !== "undefined"}
            <DelLabel key={selectedSpeaker.key} attrs={$delegateAttributes[selectedSpeaker.key]} />
        {/if}
        <Timer 
            name="delegate"
            duration={motion.speakingTime}
            bind:this={delTimer}
            bind:running
            disableKeyHandlers={typeof selectedSpeaker === "undefined"}
            onPause={(t) => updateStats(stats, selectedSpeaker?.key, dat => dat.durationSpoken += t)}
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
    <!-- Right -->
    <div class="flex flex-col gap-6 h-full overflow-hidden">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegateAttributes}
            bind:this={speakersList}
            useDefaultControls={{
                presentDelegates: $presentDelegates,
                validator: presentDelegateSchema
            }}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) updateStats(stats, key, dat => dat.timesSpoken++) }}
        />
    </div>
</div>