<script lang="ts">
    import _delegates from "$lib/sample_delegates.json";
    import SpeakerList from "$lib/dashboard/SpeakerList.svelte";
    import type { DelegateMap, SessionData } from "$lib/dashboard/types";
    import { parseTime, stringifyTime } from "$lib/time";
    import Timer from "$lib/Timer.svelte";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/dashboard/DelPopup.svelte";
    import { popup } from "@skeletonlabs/skeleton";

    let delegates: DelegateMap = _delegates;
    const labels = Object.fromEntries(Array.from(
        Object.entries(delegates), 
        ([k, attrs]) => [k, attrs.name]
    ));

    const { presentDelegates, speakersList: order } = getContext<SessionData>("sessionData");

    // Timer
    let timer: Timer;
    let secsRemaining: Readable<number>;
    let running: boolean = false;
    let duration: number = 10;
    let currentSpeaker: string | undefined;

    // Speakers List
    let speakersList: SpeakerList;
    let delegateInput: string;
    let durInput: string;
    let cleared: Readable<boolean>;
    let allDone: Readable<boolean>;

    // Button triggers
    function start() {
        running = true;
        speakersList.start();
    }
    function pause() {
        running = false;
    }
    function next() {
        timer.reset();
        speakersList.next();
    }
    function addDelegate(inp?: string) {
        speakersList.addSpeaker(inp ?? delegateInput);
        delegateInput = "";
    }
    function setDuration() {
        let secs = Number.isInteger(+durInput) ? +durInput : parseTime(durInput);
        if (typeof secs !== "undefined") {
            duration = secs;
            timer.reset();
        }
        durInput = "";
    }
    function setCurrentSpeaker(k: string | undefined) {
        timer?.reset();
        currentSpeaker = k;
    }
</script>

<div class="grid grid-cols-[2fr_1fr] gap-12 h-full">
    <!-- Left -->
    <div class="flex flex-col gap-5 self-center">
        <div class="flex flex-col gap-3">
            <h2 class="h2 text-center">{typeof currentSpeaker !== "undefined" ? labels[currentSpeaker] ?? currentSpeaker : '-'}</h2>
            <h2 class="h2 text-center">{stringifyTime($secsRemaining)}/{stringifyTime(duration)}</h2>
        </div>
        <Timer
            {duration}
            bind:this={timer}
            bind:secsRemaining
            bind:running
            height="h-10"
        />
        <div class="flex flex-row gap-3 justify-center">
            {#if !running}
                <button class="btn variant-filled-primary" on:click={start}>Start</button>
            {:else}
                <button class="btn variant-filled-primary" on:click={pause}>Pause</button>
            {/if}
            <button class="btn variant-filled-primary" disabled={$allDone} on:click={next}>Next</button>
            <button class="btn variant-filled-primary" on:click={timer.reset}>Reset</button>
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
            onSelectChange={setCurrentSpeaker}
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
                on:click={speakersList.clear}
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
    {delegates}
    presentDelegates={$presentDelegates}
    on:selection={e => addDelegate(String(e.detail.value))}
/>