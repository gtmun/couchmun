<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { getSessionDataContext } from "$lib/stores/session";
    import { getStatsContext, updateStats } from "$lib/stores/stats";
    import type { Speaker } from "$lib/types";
    import { parseTime } from "$lib/util/time";
    import { tick } from "svelte";
    
    import type { Readable } from "svelte/store";

    const { settings: { delegateAttributes }, presentDelegates, speakersList: order } = getSessionDataContext();
    const { stats } = getStatsContext();

    // Timer
    let running: boolean = false;
    let duration: number = 60;
    let resetTimer: () => void;
    let canReset: Readable<boolean>;
    
    // Speakers List
    let speakersList: SpeakerList;
    let durInput: string;
    let allDone: Readable<boolean>;
    let selectedSpeaker: Speaker | undefined;

    $: if (running) {
        speakersList?.start();
    }
    async function reset() {
        resetTimer?.();
        await tick();
    }
    // Button triggers
    async function next() {
        await reset();
        speakersList.next();
    }
    function setDuration() {
        let secs = parseTime(durInput);
        if (typeof secs !== "undefined") {
            duration = secs;
            reset();
        }
        durInput = "";
    }
</script>

<div class="grid grid-cols-[2fr_1fr] gap-12 h-full">
    <!-- Left -->
    <div class="flex flex-col gap-5 self-center">
        {#if typeof selectedSpeaker !== "undefined"}
            <DelLabel key={selectedSpeaker.key} attrs={$delegateAttributes[selectedSpeaker.key]} />
        {/if}
        
        <Timer
            name="total"
            bind:duration
            bind:running
            bind:canReset
            bind:reset={resetTimer}
            disableKeyHandlers={typeof selectedSpeaker === "undefined"}
            onPause={(t) => updateStats(stats, selectedSpeaker?.key, dat => dat.durationSpoken += t)}
            editable
        />
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" disabled={typeof selectedSpeaker === "undefined"} on:click={() => running = true}>Start</button>
            {:else}
                <button class="btn variant-filled-primary" on:click={() => running = false}>Pause</button>
            {/if}
            <button class="btn variant-filled-primary" disabled={$allDone} on:click={next}>Next</button>
            <button class="btn variant-filled-primary" disabled={!$canReset} on:click={reset}>Reset</button>
        </div>
    </div>
    <!-- Right -->
    <div class="flex flex-col gap-4 h-full overflow-hidden">
        <!-- List -->
        <SpeakerList
            bind:order={$order}
            delegates={$delegateAttributes}
            bind:this={speakersList}
            useDefaultControls={{
                presentDelegates: $presentDelegates,
                validator: presentDelegateSchema
            }}
            bind:allDone
            bind:selectedSpeaker
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) updateStats(stats, key, dat => dat.timesSpoken++) }}
        />
        <!-- Timer config -->
        <div class="flex flex-row gap-5">
            <form class="contents" on:submit|preventDefault={setDuration}>
                <label class="flex flex-grow items-center">
                    <span>Speaker Time</span>
                    <input class="input flex-grow" bind:value={durInput} placeholder="mm:ss" />
                </label>
            </form>
        </div>
    </div>
</div>
