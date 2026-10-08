<!--
    @component The page for standard speakers list, consisting of:
    - A timer panel with a timer (delegate speaking time)
    - An editable speakers list
-->
<script lang="ts">
    import { slide } from "svelte/transition";

    import TimerPanel from "#lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import SpeakLayout from "#lib/components/SpeakLayout.svelte";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import { Delegate, findDelegate } from "#lib/db/delegates.js";
    import { db } from "#lib/db/index.svelte.js";
    import type { SpeakerFA } from "#lib/types.d.ts";
    import { a11yLabel, NO_FIGURE } from "#lib/util/index.js";
    import { parseTime } from "#lib/util/time.js";
    import MdiChevronDown from "~icons/mdi/chevron-down";
    import MdiChevronUp from "~icons/mdi/chevron-up";
    import MdiMinus from "~icons/mdi/minus";
    import MdiThumbUp from "~icons/mdi/thumb-up";

    interface Props {
        delegates: Delegate[],
        order: SpeakerFA[],
        duration?: number
    }
    let { delegates, order = $bindable(), duration = $bindable(60) }: Props = $props();

    const sessionData = getSessionContext();
    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();
    let durInput: string = $state("");
    let shiftDown = $state(false);
    
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
        const setToFor = (typeof s === "undefined" && !shiftDown) || s === "against";
        return setToFor ? "for" : "against";
    }

    // Default for-against placement in speaker list
    const ORDER_RANGE = 4;
    const N_ORDERS = 1 + 2 * ORDER_RANGE;
    let orderIndex = $state(1);
    let faOrder = $derived.by(() => {
        if (orderIndex != 0) return {
            invert: orderIndex > ORDER_RANGE,
            delta: ((orderIndex - 1) % ORDER_RANGE) + 1
        }
    });
    let faOrderName = $derived.by(() => {
        if (typeof faOrder === "undefined") return "Manual";
        return !faOrder.invert
            ? `${faOrder.delta}F, ${faOrder.delta}A`
            : `${faOrder.delta}A, ${faOrder.delta}F`;
    });
    function getDefault(i: number) {
        if (typeof faOrder === "undefined") return undefined;
        return faOrder.invert == (Math.floor(i / faOrder.delta) % 2 != 0);
    }
    
    function troolSelect<T>(t: boolean | undefined, sel_true: T, sel_false: T, sel_undef: T) {
        if (typeof t === "undefined") return sel_undef;
        return t ? sel_true : sel_false;
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

<SpeakLayout>
    {#snippet main()}
        <TimerPanel
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
    {/snippet}
    {#snippet side()}
        <!-- List -->
        <SpeakerList
            {delegates}
            bind:order
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
            onCreate={(_, i, s) => (s as SpeakerFA).stance = troolSelect(getDefault(i), "for", "against", undefined)}
        >
            {#snippet extra(speaker: SpeakerFA, index)}
                {@const speakerLabel = findDelegate(delegates, speaker.key)?.name ?? "unknown"}
                {@const invertedFavor = invertFavor(speaker.stance)}

                <button 
                    class={["btn-icon transition", presetCls(speaker)]}
                    onclick={() => order[index].stance = invertedFavor}
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
        <!-- F/A order -->
        <div class="flex flex-row items-center gap-1">
            <div class="flex flex-col w-15">
                <span>Order</span>
                <span class="tabular-nums">{faOrderName}</span>
            </div>
            <div class="flex flex-col gap-1">
                <button 
                    class="btn btn-sm py-0! preset-filled-primary-500"
                    onclick={() => orderIndex = (orderIndex + 1) % N_ORDERS}
                >
                    <MdiChevronUp />
                </button>
                <button 
                    class="btn btn-sm py-0! preset-filled-primary-500"
                    onclick={() => orderIndex = (orderIndex + N_ORDERS - 1) % N_ORDERS}
                >
                    <MdiChevronDown />
                </button>
            </div>
            <div class="flex grow justify-center">
                <div class="flex gap-1 justify-center items-center p-2 border rounded-md border-surface-200-800">
                    <!-- eslint-disable-next-line svelte/require-each-key -->
                    {#each { length: 8 } as _, i}
                        {@const item = getDefault(i)}
                        <div class={[
                            "flex size-6 rounded-md transition-color items-center justify-center",
                            troolSelect(item,
                                "preset-filled-success-200-800",
                                "preset-filled-error-200-800",
                                "preset-filled-surface-200-800",
                            )
                        ]}>
                            {troolSelect(item, "F", "A", NO_FIGURE)}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/snippet}
</SpeakLayout>

<svelte:window
    onkeydown={e => shiftDown = e.shiftKey}
    onkeyup={e => shiftDown = e.shiftKey}
/>
