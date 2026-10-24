<!--
    @component The motion page for round robins, consisting of:
    - A header topic
    - A timer panel with a timer (delegate speaking time)
    - A speakers list that is automatically populated with all delegates
-->
<script lang="ts">
    import TimerPanel, { onRunningChangeSL } from "#lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import SpeakerListEditControls from "#lib/components/SpeakerListEditControls.svelte";
    import SpeakerListRR from "#lib/components/SpeakerListRR.svelte";
    import SpeakLayout from "#lib/components/SpeakLayout.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import { findDelegate } from "#lib/db/delegates.js";
    import { db } from "#lib/db/index.svelte.js";
    import type { Motion, Speaker } from "#lib/types.d.ts";
    import { TimerStateArray } from "#lib/util/timer.svelte.ts";
    
    interface Props {
        motion: Motion & { kind: "rr" };
        order: Speaker[]
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    
    let speakersList = $state<SpeakerList>();
    const comboboxDelegates = $derived.by(() => {
        let addedDelegates = new Set(order.map(s => s.key));
        return $delegates.filter(d => d.isPresent() && !addedDelegates.has(d.id));
    });
    const timerArray = new TimerStateArray(getClockContext(), [{
        durationSecs: () => motion.speakingTime,
        onDurationChange: d => motion.speakingTime = d,
        onRunningChange(running, timeSincePause) {
            sessionData.updateTabTitleExtras(running, this.secsRemaining);
            return onRunningChangeSL(running, timeSincePause, db, speakersList);
        },
        onTimeChange(secsRemaining) {
            sessionData.updateTabTitleExtras(this.running, secsRemaining);
        },
    }]);
</script>

<SpeakLayout>
    {#snippet main()}
        <TimerPanel
            {speakersList}
            {timerArray}
        />
    {/snippet}
    {#snippet side()}
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={() => timerArray.reset()}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        >
            {#snippet controls()}
                <div class="flex flex-col items-stretch gap-1">
                    <SpeakerListRR {comboboxDelegates} bind:order proposer={findDelegate($delegates, motion.delegate)} {speakersList} />
                    <SpeakerListEditControls delegates={comboboxDelegates} bind:order onSelect={speakersList?.addSpeaker} />
                </div>
            {/snippet}
        </SpeakerList>
    {/snippet}
</SpeakLayout>
