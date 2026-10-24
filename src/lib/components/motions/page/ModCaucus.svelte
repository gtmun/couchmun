<!--
    @component The motion page for moderated caucuses, consisting of:
    - A header topic
    - A timer panel with two timers (delegate and total time)
    - An editable speakers list
-->
<script lang="ts">
    import { numSpeakersStr } from "#lib/components/motions/form/MotionForm.svelte";
    import TimerPanel, { onRunningChangeSL } from "#lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import SpeakerListEditControls from "#lib/components/SpeakerListEditControls.svelte";
    import SpeakerListFirstLast from "#lib/components/SpeakerListFirstLast.svelte";
    import SpeakLayout from "#lib/components/SpeakLayout.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import { db } from "#lib/db/index.svelte.js";
    import type { Motion, Speaker } from "#lib/types.d.ts";
    import { TimerStateArray, type TimerState } from "#lib/util/timer.svelte.ts";

    interface Props {
        motion: Motion & { kind: "mod" };
        order: Speaker[];
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates, preferences } = sessionData;

    let speakersList = $state<SpeakerList>();
    const timerArray = new TimerStateArray(getClockContext(), [
        {
            durationSecs: () => motion.speakingTime,
            onDurationChange: d => motion.speakingTime = d,
            onRunningChange(running) {
                sessionData.updateTabTitleExtras(running, this.secsRemaining);
            },
            onTimeChange(secsRemaining) {
                sessionData.updateTabTitleExtras(this.running, secsRemaining);
            },
        },
        {
            durationSecs: () => motion.totalTime,
            onDurationChange: d => motion.totalTime = d,
            onRunningChange(running, timeSincePause) {
                return onRunningChangeSL(running, timeSincePause, db, speakersList);
            }
        }
    ], {
        interact: () => $preferences.pauseMainTimer ? "sync" : "cascade",
    })
    /**
     * Resets the delegate timer. It also does not trigger the effect if there was no speaker
     * (in which case a reset doesn't really need to happen).
     */
    function resetDel(oldSpeaker?: Speaker) {
        if (typeof oldSpeaker !== "undefined") {
            deductTime(timerArray.value);
        }
        timerArray.reset([0]);
    }
    /**
     * Deduct time from the total timer if that setting is enabled.
     */
    function deductTime([delTimer, totalTimer]: TimerState[]) {
        if ($preferences.yieldMainTimer) return;
        totalTimer.offsetDuration(-delTimer.secsRemaining);
    }
</script>

<SpeakLayout>
    {#snippet main()}
        <TimerPanel
            {speakersList}
            {timerArray}
            extraControls={[
                {
                    label: "Reset",
                    disabled: () => !timerArray.canReset([0]),
                    onclick: () => resetDel(),
                },
                {
                    label: "Reset All",
                    disabled: () => !timerArray.canReset(),
                    onclick: () => timerArray.reset()
                }
            ]}
        />
    {/snippet}
    {#snippet side()}
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={resetDel}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        >
            {#snippet title()}
                Speakers List (<span class="tabular-nums">{order.length}/{numSpeakersStr(motion.totalTime, motion.speakingTime)}</span>)
            {/snippet}
            {#snippet controls()}
                <div class="flex flex-col items-stretch gap-1">
                    <SpeakerListFirstLast delegates={$delegates} {order} proposer={motion.delegate} {speakersList} />
                    <SpeakerListEditControls delegates={$delegates} bind:order onSelect={speakersList?.addSpeaker} />
                </div>
            {/snippet}
        </SpeakerList>
    {/snippet}
</SpeakLayout>
