<script lang="ts">    
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import MultiPage from "$lib/components/MultiPage.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    
    const { delegates } = getSessionContext();
    let durations = $state([60, 60, 60, 60]);
</script>

<MultiPage
    pages={[
        { name: "Reading Period" },
        { name: "Presentation" },
        { name: "Question & Answer" },
        { name: "Amendment Period" },
        { name: "Voting" }
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
            voing
        {/if}
    {/snippet}
</MultiPage>
