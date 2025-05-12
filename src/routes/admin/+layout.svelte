<!--
  @component This component is the base layout for the admin pages on the site.
  
  This basically initializes the admin app bar (the yellow bar on the top).
-->
<script lang="ts">
    import { base } from '$app/paths';
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import { db } from '$lib/db/index.svelte';
    
    import { AppBar } from '@skeletonlabs/skeleton-svelte';
    import MdiChevronLeft from "~icons/mdi/chevron-left";

    let { children } = $props();
    const title = db.settingStore("title", "");
</script>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar 
            background="bg-warning-100-900" 
            toolbarGridCols="grid-cols-[auto_1fr_auto]" 
            centerClasses="place-self-center"
            trailClasses="place-content-end"
        >
            {#snippet lead()}
                <a
                    href="{base}/dashboard"
                    class="btn-icon-std"
                    aria-label="Return to Dashboard"
                    title="Return to Dashboard"
                    tabindex={0}
                >
                    <MdiChevronLeft width="36" height="36" />
                </a>
            {/snippet}
            <div class="flex flex-col gap-1">
                <BarHeader bind:title={$title} />
            </div>
            {#snippet trail()}
                <!-- Alignment spacing -->
                <div class="btn-icon-std"></div>
            {/snippet}
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children()}
    </main>
</div>