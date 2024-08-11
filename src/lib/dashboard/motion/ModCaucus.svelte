<script lang="ts">
    import SpeakerList from "$lib/dashboard/SpeakerList.svelte";
    import type { Motion, SessionData, Speaker } from "$lib/dashboard/types";
    import { stringifyTime } from "$lib/time";
    import Timer from "$lib/Timer.svelte";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/dashboard/DelPopup.svelte";
    import { popup } from "@skeletonlabs/skeleton";
    import DelLabel from "$lib/dashboard/DelLabel.svelte";

    export let motion: Motion & { kind: "mod" };

    const { delegateAttributes, presentDelegates } = getContext<SessionData>("sessionData");
    const labels = Object.fromEntries(Array.from(
        Object.entries($delegateAttributes), 
        ([k, attrs]) => [k, attrs.name]
    ));

    // Timer
    let totalTimer: Timer;
    let totalSecsRemaining: Readable<number>;

    let delTimer: Timer;
    let delSecsRemaining: Readable<number>;
    let running: boolean = false;
    
    // Speakers List
    let speakersList: SpeakerList;
    let order: Speaker[] = [];
    let delegateInput: string;
    let cleared: Readable<boolean>;
    let allDone: Readable<boolean>;
    let selectedSpeaker: Readable<string | undefined>;
    $: ($selectedSpeaker, reset());

    // Button triggers
    function start() {
        running = true;
        speakersList?.start();
    }
    function pause() {
        running = false;
    }
    function reset() {
        delTimer?.reset();
    }
    function resetAll() {
        totalTimer?.reset();
        delTimer?.reset();
    }
    function next() {
        reset();
        speakersList?.next();
    }
    function addDelegate(inp?: string) {
        speakersList?.addSpeaker(inp ?? delegateInput);
        delegateInput = "";
    }
</script>

<div class="grid grid-cols-[2fr_1fr] gap-12 h-full">
    <!-- Left -->
    <div class="flex flex-col gap-5 self-center">
        <DelLabel speaker={$selectedSpeaker} />
        <div class="flex flex-col gap-3">
            <h2 class="h2 text-center">{stringifyTime($totalSecsRemaining)}/{stringifyTime(motion.totalTime)}</h2>
            <Timer
                duration={motion.totalTime}
                bind:this={totalTimer}
                bind:secsRemaining={totalSecsRemaining}
                bind:running
                height="h-10"
            />
        </div>
        <div class="flex flex-col gap-3">
            <h2 class="h2 text-center">{stringifyTime($delSecsRemaining)}/{stringifyTime(motion.speakingTime)}</h2>
            <Timer
                duration={motion.speakingTime}
                bind:this={delTimer}
                bind:secsRemaining={delSecsRemaining}
                bind:running
                height="h-10"
            />
        </div>
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" disabled={typeof $selectedSpeaker === "undefined"} on:click={start}>Start</button>
            {:else}
                <button class="btn variant-filled-primary" on:click={pause}>Pause</button>
            {/if}
            <button class="btn variant-filled-primary" disabled={$allDone} on:click={next}>Next</button>
            <button class="btn variant-filled-primary" disabled={$delSecsRemaining === motion.speakingTime} on:click={reset}>Reset</button>
            <button class="btn variant-filled-primary" disabled={$totalSecsRemaining === motion.totalTime} on:click={resetAll}>Reset all</button>
        </div>
    </div>
    <!-- Right -->
    <div class="flex flex-col gap-6 h-full overflow-hidden">
        <!-- List -->
        <SpeakerList
            bind:order
            {labels}
            bind:this={speakersList}
            bind:cleared
            bind:allDone
            bind:selectedSpeaker
        />
        <!-- Add button -->
        <div class="flex flex-row gap-3">
            <form class="contents" on:submit|preventDefault={() => addDelegate()}>
                <input 
                    class="input" 
                    bind:value={delegateInput}
                    use:popup={{ ...defaultPopupSettings("addDelegatePopup"), placement: "left-end" }}
                    {...defaultPlaceholder($presentDelegates)}
                />
                <button
                    type="submit"
                    class="btn variant-filled-primary"
                    disabled={$presentDelegates.length === 0}
                >Add</button>
            </form>
            <button
                type="submit"
                class="btn variant-filled-primary"
                disabled={$cleared}
                on:click={() => order = []}
            >
                Clear
            </button>
        </div>
    </div>
</div>

<DelPopup 
    popupID="addDelegatePopup"
    bind:input={delegateInput}
    delegates={$delegateAttributes}
    presentDelegates={$presentDelegates}
    on:selection={e => addDelegate(String(e.detail.value))}
/>