<!--
    @component The page for standard speakers list, consisting of:
    - A timer panel with a timer (delegate speaking time)
    - An editable speakers list
-->
<script lang="ts">
    import TimerPanel, { onRunningChangeSL } from "#lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import SpeakLayout from "#lib/components/SpeakLayout.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import { db } from "#lib/db/index.svelte.js";
    import { parseTime } from "#lib/util/time.js";
    import { TimerStateArray } from "#lib/util/timer.svelte.ts";

    const sessionData = getSessionContext();
    const { speakersList: order, delegates, selectedMotion } = sessionData;

    let duration: number = $derived.by(() => {
        // Use motion's speaking time if motion configured
        if ($selectedMotion?.kind === "spklist") {
            return $selectedMotion.speakingTime;
        }

        // Fallback if motion not configured
        return 60;
    });
    let speakersList = $state<SpeakerList>();
    let durInput: string = $state("");
    const timerArray = new TimerStateArray(getClockContext(), [{
        durationSecs: () => duration,
        onDurationChange: d => duration = d,
        onRunningChange(running, timeSincePause) {
            sessionData.updateTabTitleExtras(running, this.secsRemaining);
            return onRunningChangeSL(running, timeSincePause, db, speakersList);
        },
        onTimeChange(secsRemaining) {
            sessionData.updateTabTitleExtras(this.running, secsRemaining);
        },
    }]);

    function setDuration(e: SubmitEvent) {
        e.preventDefault();

        let secs = parseTime(durInput);
        if (typeof secs !== "undefined") {
            duration = secs;
        }
        durInput = "";
    }
</script>

<SpeakLayout>
    {#snippet main()}
        <TimerPanel
            {speakersList}
            {timerArray}
            editable
        />
    {/snippet}
    {#snippet side()}
        <!-- List -->
        <SpeakerList
            delegates={$delegates}
            bind:order={$order}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={() => timerArray.reset()}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        />
        <!-- Timer config -->
        <div class="flex flex-row gap-5">
            <form class="contents" onsubmit={setDuration}>
                <label class="flex grow items-center">
                    <span>Speaker Time</span>
                    <input class="input grow" bind:value={durInput} placeholder="mm:ss" disabled={timerArray.get(0)?.running} />
                </label>
            </form>
        </div>
    {/snippet}
</SpeakLayout>
