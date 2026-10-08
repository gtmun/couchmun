<!--
    @component The motion page for round robins, consisting of:
    - A header topic
    - A timer panel with a timer (delegate speaking time)
    - A speakers list that is automatically populated with all delegates
-->
<script lang="ts">
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import SpeakerListEditControls from "$lib/components/SpeakerListEditControls.svelte";
    import SpeakerListRR from "$lib/components/SpeakerListRR.svelte";
    import SpeakLayout from "$lib/components/SpeakLayout.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import type { Motion, Speaker } from "$lib/types";
    
    interface Props {
        motion: Motion & { kind: "rr" };
        order: Speaker[]
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    
    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();
    const comboboxDelegates = $derived.by(() => {
        let addedDelegates = new Set(order.map(s => s.key));
        return $delegates.filter(d => d.isPresent() && !addedDelegates.has(d.id));
    });

    function reset() {
        timerPanel?.reset();
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
            durations={[motion.speakingTime]}
            bind:this={timerPanel}
        />
    {/snippet}
    {#snippet side()}
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
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
