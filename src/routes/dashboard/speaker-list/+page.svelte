<script lang="ts">
    import DelLabel from "$lib/dashboard/DelLabel.svelte";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/dashboard/DelPopup.svelte";
    import SpeakerList from "$lib/dashboard/SpeakerList.svelte";
    import Timer from "$lib/dashboard/Timer.svelte";
    import type { SessionData } from "$lib/dashboard/types";
    import { parseTime } from "$lib/time";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";
    import { popup } from "@skeletonlabs/skeleton";

    const { delegateAttributes, presentDelegates, speakersList: order } = getContext<SessionData>("sessionData");
    const labels = Object.fromEntries(Array.from(
        Object.entries($delegateAttributes), 
        ([k, attrs]) => [k, attrs.name]
    ));

    // Timer
    let running: boolean = false;
    let duration: number = 10;
    let reset: () => void;
    let canReset: Readable<boolean>;
    
    // Speakers List
    let speakersList: SpeakerList;
    let delegateInput: string;
    let durInput: string;
    let cleared: Readable<boolean>;
    let allDone: Readable<boolean>;
    let selectedSpeaker: Readable<string | undefined>;
    $: ($selectedSpeaker, reset?.());

    // Button triggers
    function start() {
        running = true;
        speakersList.start();
    }
    function pause() {
        running = false;
    }
    function next() {
        reset();
        speakersList.next();
    }
    function addDelegate(inp?: unknown) {
        speakersList.addSpeaker(inp as string ?? delegateInput);
        delegateInput = "";
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
            bind:order={$order}
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
                on:click={() => $order = []}
            >
                Clear
            </button>
        </div>
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

<DelPopup 
    popupID="addDelegatePopup"
    bind:input={delegateInput}
    delegates={$delegateAttributes}
    presentDelegates={$presentDelegates}
    on:selection={e => addDelegate(e.detail.value)}
/>