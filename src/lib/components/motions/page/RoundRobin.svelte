<!--
    @component The motion page for round robins, consisting of:
    - A header topic
    - A timer panel with a timer (delegate speaking time)
    - A speakers list that is automatically populated with all delegates
-->
<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import type { Motion, Speaker } from "$lib/types";
    import { lazyslide } from "$lib/util";

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
        return $delegates.filter(d => !addedDelegates.has(d.id));
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
            durations={[motion.speakingTime]}
            bind:this={timerPanel}
        />
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
        <!-- List -->
        <SpeakerList
            bind:order
            delegates={$delegates}
            {comboboxDelegates}
            bind:this={speakersList}
            onBeforeSpeakerUpdate={reset}
            onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
        >
            {#snippet subcontrols()}
                {#if !order.some(s => s.key == motion.delegate)}
                    <div
                        class="card card-filled p-2 flex justify-between items-center preset-filled-surface-200-800"
                        transition:lazyslide
                    >
                        <DelLabel attrs={findDelegate($delegates, motion.delegate)} inline />
                        <div>
                            <button class="btn preset-filled-primary-500" onclick={() => speakersList?.addSpeakerFirst(motion.delegate)}>First</button>
                            <button class="btn preset-filled-primary-500" onclick={() => speakersList?.addSpeakerLast(motion.delegate)}>Last</button>
                        </div>
                    </div>
                {/if}
            {/snippet}
        </SpeakerList>
    </div>
</div>