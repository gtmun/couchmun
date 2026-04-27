<script lang="ts">    
    import { Popover, Portal } from "@skeletonlabs/skeleton-svelte";

    import ForAgainst from "$lib/components/ForAgainst.svelte";
    import MultiPage from "$lib/components/MultiPage.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import type { SpeakerFA } from "$lib/types";
    import { proxify } from "$lib/util/sv.svelte";
    import { parseTime, sanitizeTime, stringifyTime } from "$lib/util/time";
    import MdiWrench from "~icons/mdi/wrench";

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    let durations = $state([60, 60, 60, 60, 60]);
    let durInputs = $derived(proxify(durations.map(d => stringifyTime(d))));
    let faOrder = $state<SpeakerFA[]>([]);

    let timer = $state<Timer>();
    let running = $state<boolean>(false);

    const pages = [
        { name: "Reading Period" },
        { name: "Presentation" },
        { name: "Question & Answer" },
        { name: "Amendment Period" },
        { name: "For & Against" }
    ];
</script>

<MultiPage {pages}>
    {#snippet topTail()}
        <Popover>
            <Popover.Trigger class="btn-icon preset-filled-surface-500">
                <MdiWrench />
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content class="card w-96 p-4 bg-surface-100-900 shadow-xl">
                        <div class="space-y-4">
                            <h6 class="h6 text-center">Timer Durations</h6>
                            <!-- eslint-disable-next-line svelte/require-each-key -->
                            {#each durations as _, i}
                                <lapel class="label group">
                                    <span>
                                        {pages[i].name}
                                        <span class="text-surface-500 not-group-has-focus-within:opacity-0 transition-opacity duration-150">
                                            &middot; {sanitizeTime(durInputs[i])}
                                        </span>
                                    </span>
                                    <input
                                        class="input"
                                        bind:value={durInputs[i]}
                                        onchange={e => durations[i] = parseTime(e.currentTarget.value) ?? durations[i]}
                                    >
                                </lapel>
                            {/each}
                        </div>
                        <Popover.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-100-900)]">
                            <Popover.ArrowTip />
                        </Popover.Arrow>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover>
    {/snippet}
    {#snippet children(page)}
        {#if page != 4}
            <!-- FIXME: Unify UnmodCaucus and this -->
            <div class="flex flex-col justify-center h-full gap-5">
                <Timer
                    bind:duration={durations[page]}
                    bind:this={timer}
                    {running}
                    onRunningChange={r => {
                        running = r;
                        sessionData.updateTabTitleExtras(r, timer?.secsRemaining?.());
                    }}
                    onTimeChange={msElapsed => sessionData.updateTabTitleExtras(running, msElapsed / 1000)}
                    editable
                />
                <div class="flex flex-row gap-3 justify-center">
                    <button class="btn preset-filled-primary-500" onclick={() => running = !running}>
                        {!running ? 'Start' : 'Pause'}
                    </button>
                    <button class="btn preset-filled-primary-500" onclick={timer?.reset}>Reset</button>
                </div>
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
