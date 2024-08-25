<script lang="ts">
    import DelLabel from "$lib/components/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import type { Motion, Speaker } from "$lib/types";
    import type { Readable } from "svelte/store";

    export let motion: Motion & { kind: "rr" };

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();

    // Timer
    let running: boolean = false;
    let reset: () => void;
    let canReset: Readable<boolean>;
    
    // Speakers List
    let speakersList: SpeakerList;
    let order: Speaker[] = $presentDelegates.map(key => ({ key, completed: false }));
    let allDone: Readable<boolean>;
    let selectedSpeaker: Readable<string | undefined>;
    $: ($selectedSpeaker, reset?.());

    // Button triggers
    function start() {
        running = true;
        speakersList?.start();
    }
    function pause() {
        running = false;
    }
    function next() {
        reset();
        speakersList?.next();
    }
</script>

<div class="grid grid-cols-[2fr_1fr] gap-12 h-full">
    <!-- Left -->
    <div class="flex flex-col gap-5 self-center">
        <DelLabel speaker={$selectedSpeaker} />
        <Timer 
            duration={motion.speakingTime} 
            bind:reset
            bind:canReset
            bind:running 
        />
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" disabled={typeof $selectedSpeaker === "undefined"} on:click={start}>Start</button>
            {:else}
                <button class="btn variant-filled-primary" on:click={pause}>Pause</button>
            {/if}
            <button class="btn variant-filled-primary" disabled={$allDone} on:click={next}>Next</button>
            <button class="btn variant-filled-primary" disabled={!$canReset} on:click={reset}>Reset</button>
        </div>
    </div>
    <!-- Right -->
    <div class="flex flex-col gap-6 h-full overflow-hidden">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegateAttributes}
            bind:this={speakersList}
            bind:allDone
            bind:selectedSpeaker
        />
    </div>
</div>