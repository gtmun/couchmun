<!--
    @component The motion page for moderated caucuses, consisting of:
    - A header topic
    - A timer panel with two timers (delegate and total time)
    - An editable speakers list
-->
<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { numSpeakersStr } from "$lib/components/motions/form/MotionForm.svelte";
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import type Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { findDelegate } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import type { Motion, Speaker } from "$lib/types";
    import { lazyslide } from "$lib/util";

    interface Props {
        motion: Motion & { kind: "mod" };
        order: Speaker[];
    }
    let { motion, order = $bindable() }: Props = $props();

    const sessionData = getSessionContext();
    const { delegates, preferences } = sessionData;

    let timerPanel = $state<TimerPanel>();
    let speakersList = $state<SpeakerList>();

    /**
     * Resets the delegate timer. It also does not trigger the effect if there was no speaker
     * (in which case a reset doesn't really need to happen).
     */
    function resetDel(oldSpeaker?: Speaker) {
        if (typeof oldSpeaker !== "undefined") timerPanel?.reset(0);
    }
    /**
     * Deduct time from the total timer if that setting is enabled.
     */
    function deductTime([delTimer, totalTimer]: (Timer | undefined)[]) {
        if ($preferences.yieldMainTimer) return;
        if (!delTimer || !totalTimer) return;
        totalTimer.offsetDuration(-delTimer.secsRemaining?.());
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
            durations={[motion.speakingTime, motion.totalTime]}
            timerInteraction={$preferences.pauseMainTimer ? "sync" : "cascade"}
            onBeforeReset={deductTime}
            bind:this={timerPanel}
            resetButtons={[
                { label: "Reset", indices: [0] },
                { label: "Reset All" }
            ]}
        />
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
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