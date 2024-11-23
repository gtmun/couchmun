<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { getSessionDataContext } from "$lib/stores/session";
    import { getStatsContext, updateStats } from "$lib/stores/stats";
    import { parseTime } from "$lib/util/time";
    import { tick, untrack } from "svelte";

    const { settings: { delegateAttributes }, presentDelegates, speakersList: order } = getSessionDataContext();
    const { stats } = getStatsContext();

    // Timer
    let running: boolean = $state(false);
    let duration: number = $state(60);
    let timer: Timer | undefined = $state();
    
    // Speakers List
    let speakersList: SpeakerList | undefined = $state();
    let durInput: string = $state("");
    let selectedSpeaker = $derived(speakersList?.selectedSpeaker());

    $effect(() => {
        if (running) untrack(() => {
            speakersList?.start();
        })
    });
    async function reset() {
        timer?.reset();
        await tick();
    }
    // Button triggers
    async function next() {
        await reset();
        speakersList?.next();
    }
    function setDuration(e: SubmitEvent) {
        e.preventDefault();

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
            bind:this={timer}
            disableKeyHandlers={typeof selectedSpeaker === "undefined"}
            onPause={(t) => updateStats(stats, selectedSpeaker?.key, dat => dat.durationSpoken += t)}
            editable
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
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) updateStats(stats, key, dat => dat.timesSpoken++) }}
        />
        <!-- Timer config -->
        <div class="flex flex-row gap-5">
            <form class="contents" onsubmit={setDuration}>
                <label class="flex flex-grow items-center">
                    <span>Speaker Time</span>
                    <input class="input flex-grow" bind:value={durInput} placeholder="mm:ss" />
                </label>
            </form>
        </div>
    </div>
</div>
