<script lang="ts">
    import { base } from "$app/paths";
    import ModCaucus from "$lib/dashboard/motion/ModCaucus.svelte";
    import RoundRobin from "$lib/dashboard/motion/RoundRobin.svelte";
    import UnmodCaucus from "$lib/dashboard/motion/UnmodCaucus.svelte";
    import { getSessionDataContext } from "$lib/stores/session";

    const { selectedMotion } = getSessionDataContext();

    const isExhaustive = (s: never) => s;
</script>

<div class="h-full w-full flex flex-col items-stretch justify-center">
    {#if $selectedMotion}
        {#if $selectedMotion.kind === "mod"}
            <ModCaucus motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "unmod"}
            <UnmodCaucus motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "rr"}
            <RoundRobin motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "other"}
            <!-- TODO -->
        {:else if isExhaustive($selectedMotion)}
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