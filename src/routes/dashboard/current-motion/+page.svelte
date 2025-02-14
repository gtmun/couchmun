<!--
  @component The page for the current motion (after it was selected in the Points & Motions page).

  This page delegates to one of the motion components located in `$lib/components/motions/page`.
-->
<script lang="ts">
    import { base } from "$app/paths";
    import ModCaucus from "$lib/components/motions/page/ModCaucus.svelte";
    import RoundRobin from "$lib/components/motions/page/RoundRobin.svelte";
    import UnmodCaucus from "$lib/components/motions/page/UnmodCaucus.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";

    const sessionData = getSessionContext();
    const { selectedMotion, selectedMotionState } = sessionData;

    // FIXME: On reset, selectedMotion inits with the data it had previously
    // This can cause issues with inconsistent data
    selectedMotion.subscribe(m => {
        if ("topic" in m) {
            sessionData.barTopic = `Topic: ${m.topic}`;
        }
    });
</script>

<div class="h-full w-full flex flex-col items-stretch justify-center">
    {#if $selectedMotion && "kind" in $selectedMotion}
        {#if $selectedMotion.kind === "mod"}
            <ModCaucus motion={$selectedMotion} bind:order={$selectedMotionState.speakersList} />
        {:else if $selectedMotion.kind === "unmod"}
            <UnmodCaucus motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "rr"}
            <RoundRobin motion={$selectedMotion} bind:order={$selectedMotionState.speakersList} />
        {:else if $selectedMotion.kind === "other"}
            <!-- TODO -->
        {:else if $selectedMotion satisfies never}
            <!-- unreachable -->
        {/if}
    {:else}
        <div class="text-center">
            <h3 class="h3">No motion set.</h3>
            Visit 
            <a
                class="btn btn-sm variant-soft-primary"
                href="{base}/dashboard/points-motions"
                tabindex="0"
            >
                Points and Motions
            </a>
            to set a motion.
        </div>
    {/if}
</div>