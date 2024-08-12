<script lang="ts">
    import { base } from "$app/paths";
    import { MOTION_COMPONENTS } from "$lib/dashboard/points-motions/definitions";
    import type { SessionData } from "$lib/dashboard/types";
    import { getContext } from "svelte";

    const { selectedMotion } = getContext<SessionData>("sessionData");
</script>

<div class="h-full w-full flex flex-col items-stretch justify-center">
    {#if typeof $selectedMotion !== "undefined"}
        <svelte:component this={MOTION_COMPONENTS[$selectedMotion.kind]} motion={$selectedMotion} />
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