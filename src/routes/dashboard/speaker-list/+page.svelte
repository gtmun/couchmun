<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { presentDelegateSchema } from "$lib/motions/form_validation";
    import { parseTime } from "$lib/util/time";
    import Icon from "@iconify/svelte";
    import { untrack } from "svelte";

    const { speakersList: order, delegates } = getSessionContext();

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
    function reset() {
        timer?.reset();
    }
    // Button triggers
    function next() {
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
                name="total"
                bind:duration
                bind:running
                bind:this={timer}
                disableKeyHandlers={typeof selectedSpeaker === "undefined"}
                onPause={(t) => db.updateDelegate(selectedSpeaker?.key, d => { d.stats.durationSpoken += t; })}
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
        <!-- Mobile chevron -->
        <div class="flex justify-center lg:hidden">
            <Icon icon="mdi:chevron-down" width="24" height="24" />
        </div>
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-[25rem] lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order={$order}
            delegates={$delegates}
            bind:this={speakersList}
            useDefaultControls={{
                validator: presentDelegateSchema
            }}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
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
