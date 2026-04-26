<script lang="ts">    
    import ForAgainst from "$lib/components/ForAgainst.svelte";
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import MultiPage from "$lib/components/MultiPage.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import type { SpeakerFA } from "$lib/types";
    
    const { delegates } = getSessionContext();
    let durations = $state([60, 60, 60, 60, 60]);
    let faOrder = $state<SpeakerFA[]>([]);
</script>

<MultiPage
    pages={[
        { name: "Reading Period" },
        { name: "Presentation" },
        { name: "Question & Answer" },
        { name: "Amendment Period" },
        { name: "For & Against" }
    ]}
>
    {#snippet children(page)}
        {#if page != 4}
            <div class="flex item-stretch h-full">
                <TimerPanel
                    delegates={$delegates}
                    durations={[durations[page]]}
                    onDurationUpdate={(_, d) => durations[page] = d}
                    editable
                />
            </div>
        {:else}
            <ForAgainst
                delegates={$delegates}
                bind:order={faOrder}
                bind:duration={durations[page]}
            />
        {/if}
    {/snippet}
</MultiPage>
