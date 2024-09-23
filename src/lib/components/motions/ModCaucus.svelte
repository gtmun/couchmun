<script lang="ts">
    import DelLabel from "$lib/components/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { getSessionDataContext } from "$lib/stores/session";
    import type { AppBarData, Motion, Speaker } from "$lib/types";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";

    export let motion: Motion & { kind: "mod" };

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();
    const { topic } = getContext<AppBarData>("app-bar");
    $: topic.set(motion.topic);

    // Timer
    let running: boolean = false;
    let totalReset: () => void;
    let delReset: () => void;
    let totalResetable: Readable<boolean>;
    let delResetable: Readable<boolean>;
    
    // Speakers List
    let speakersList: SpeakerList;
    let order: Speaker[] = [];
    let allDone: Readable<boolean>;
    let selectedSpeaker: Readable<string | undefined>;
    $: ($selectedSpeaker, reset());

    $: if (running) {
        speakersList?.start();
    }
    // Button triggers
    function reset() {
        delReset?.();
    }
    function resetAll() {
        totalReset?.();
        delReset?.();
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
            name="delegate"
            duration={motion.speakingTime} 
            bind:reset={delReset} 
            bind:canReset={delResetable}
            bind:running
            disableKeyHandlers={typeof $selectedSpeaker === "undefined"}
        />
        <Timer
            name="total"
            duration={motion.totalTime} 
            bind:reset={totalReset} 
            bind:canReset={totalResetable}
            bind:running
            disableKeyHandlers
        />
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" disabled={typeof $selectedSpeaker === "undefined"} on:click={() => running = true}>Start</button>
            {:else}
                <button class="btn variant-filled-primary" on:click={() => running = false}>Pause</button>
            {/if}
            <button class="btn variant-filled-primary" disabled={$allDone} on:click={next}>Next</button>
            <button class="btn variant-filled-primary" disabled={!$delResetable} on:click={reset}>Reset</button>
            <button class="btn variant-filled-primary" disabled={!$totalResetable} on:click={resetAll}>Reset all</button>
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
            bind:allDone
            bind:selectedSpeaker
        />
    </div>
</div>