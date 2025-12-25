<!--
    @component The page for standard speakers list, consisting of:
    - A timer panel with a timer (delegate speaking time)
    - An editable speakers list
-->
<script lang="ts">
    import { slide } from "svelte/transition";

    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import type { Speaker } from "$lib/types";
    import { a11yLabel } from "$lib/util";
    import { parseTime } from "$lib/util/time";
    import MdiMinus from "~icons/mdi/minus";
    import MdiThumbUp from "~icons/mdi/thumb-up";

    const sessionData = getSessionContext();
    const { delegates } = sessionData;

    interface SpeakerFA extends Speaker {
        stance?: "for" | "against";
    }
    let order: SpeakerFA[] = $state([]);
    let duration: number = $state(60);
    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();
    let durInput: string = $state("");

    function reset() {
        timerPanel?.reset();
    }
    function setDuration(e: SubmitEvent) {
        e.preventDefault();

        let secs = parseTime(durInput);
        if (typeof secs !== "undefined") {
            duration = secs;
        }
        durInput = "";
    }

    function invertFavor(s: SpeakerFA["stance"]) {
        return s !== "for" ? "for" : "against";
    }
    function presetCls(s: SpeakerFA) {
        if (s.completed) return "preset-ui-depressed";

        if (s.stance === "for") return "preset-filled-success-200-800 hover:preset-filled-success-500";
        if (s.stance === "against") return "preset-filled-error-200-800 hover:preset-filled-error-500";
        return "preset-filled-surface-200-800 hover:preset-filled-surface-500";
    }
    function rotateCls(stance: SpeakerFA["stance"]) {
        return ["transition-transform", stance !== "for" && "rotate-180"];
    }

    $effect(() => {
        sessionData.updateTabTitleExtras(
            timerPanel?.getRunState(0) ?? false,
            timerPanel?.secsRemaining(0)
        );
    });
</script>

<div class="flex flex-col lg:flex-row h-full gap-8 items-stretch">
    <!--
        Under mobile, the timer encompasses the whole page 
        and the speakers list can be accessed by scrolling down.

        Under desktop, both are on the same screen,
        with the left side being the timer and the right side being the speakers list.
    -->
    <!-- Left/Top -->
    <div class="flex flex-col grow shrink-0 basis-full lg:basis-auto">
        <TimerPanel
            delegates={$delegates}
            {speakersList}
            durations={[duration]}
            onDurationUpdate={(_, d) => duration = d}
            bind:this={timerPanel}
            editable
        >
            {#snippet label(name)}
                {@const speaker: SpeakerFA | undefined = speakersList?.selectedSpeaker()}
                {#if speaker}
                    <div class="flex items-center">
                        <h2 class="h2">{name}</h2>
                        {#if speaker?.stance}
                            <div transition:slide={{ duration: 150, axis: "x" }}>
                                <MdiThumbUp class={["size-8 ml-3", rotateCls(speaker.stance)]} />
                            </div>
                        {/if}
                    </div>
                {/if}
            {/snippet}
        </TimerPanel>
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            delegates={$delegates}
            bind:order
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        >
            {#snippet extra(speaker: SpeakerFA)}
                {@const speakerLabel = findDelegate($delegates, speaker.key)?.name ?? "unknown"}
                {@const invertedFavor = invertFavor(speaker.stance)}

                <button 
                    class={["btn-icon-std transition", presetCls(speaker)]}
                    onclick={() => speaker.stance = invertedFavor}
                    {...a11yLabel(`Set ${speakerLabel} to ${invertedFavor}`)}
                    disabled={speaker.completed}
                >
                    {#if speaker.stance}
                        <MdiThumbUp class={rotateCls(speaker.stance)} />
                    {:else}
                        <MdiMinus />
                    {/if}
                </button>
            {/snippet}
        </SpeakerList>
        <!-- Timer config -->
        <div class="flex flex-row gap-5">
            <form class="contents" onsubmit={setDuration}>
                <label class="flex grow items-center">
                    <span>Speaker Time</span>
                    <input class="input grow" bind:value={durInput} placeholder="mm:ss" disabled={timerPanel?.getRunState(0)} />
                </label>
            </form>
        </div>
    </div>
</div>
