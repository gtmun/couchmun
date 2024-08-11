<script lang="ts">
    import { base } from "$app/paths";
    import ModCaucus from "$lib/dashboard/motion/ModCaucus.svelte";
    import UnmodCaucus from "$lib/dashboard/motion/UnmodCaucus.svelte";
    import type { SessionData } from "$lib/dashboard/types";
    import { getContext } from "svelte";

    const { selectedMotion } = getContext<SessionData>("sessionData");
    function absurd<T>(s: never): T { return s; }
</script>

<div class="h-full w-full flex flex-col items-stretch justify-center">
    {#if typeof $selectedMotion !== "undefined"}
        {#if $selectedMotion.kind === "mod"}
            <ModCaucus motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "unmod"}
            <UnmodCaucus motion={$selectedMotion} />
        {:else if $selectedMotion.kind === "other"}
            <!-- TODO -->
        {:else if absurd($selectedMotion) }
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