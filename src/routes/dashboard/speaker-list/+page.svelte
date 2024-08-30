<script lang="ts">
    import DelLabel from "$lib/components/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { getSessionDataContext } from "$lib/stores/session";
    import { parseTime } from "$lib/util/time";
    
    import type { Readable } from "svelte/store";

    const { settings: { delegateAttributes }, presentDelegates, speakersList: order } = getSessionDataContext();

    // Timer
    let running: boolean = false;
    let duration: number = 60;
    let reset: () => void;
    let canReset: Readable<boolean>;
    
    // Speakers List
    let speakersList: SpeakerList;
    let durInput: string;
    let allDone: Readable<boolean>;
    let selectedSpeaker: Readable<string | undefined>;
    $: ($selectedSpeaker, reset?.());

    $: if (running) {
        speakersList?.start();
    }
    // Button triggers
    function next() {
        reset();
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
        <DelLabel speaker={$selectedSpeaker} />

        <Timer
            {duration}
            bind:running
            bind:canReset
            bind:reset
            disableKeyHandlers={typeof $selectedSpeaker === "undefined"}
        />
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" disabled={typeof $selectedSpeaker === "undefined"} on:click={() => running = true}>Start</button>
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
