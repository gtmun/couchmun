<!--
  @component This component is the base layout for the admin pages on the site.
  
  This basically initializes the admin app bar (the yellow bar on the top).
-->
<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton-svelte';

    import { resolve } from "$app/paths";
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import { db } from '$lib/db/index.svelte';
    import MdiChevronLeft from "~icons/mdi/chevron-left";

    let { children } = $props();
    const title = db.settingStore("title", "");
</script>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar 
            background="preset-ui-admin-header" 
            toolbarGridCols="grid-cols-[auto_1fr_auto]" 
            leadClasses="items-center"
            centerClasses="place-self-center"
            trailClasses="items-center place-content-end"
        >
            {#snippet lead()}
                <a
                    href="{resolve("/dashboard")}"
                    class="btn-icon-std"
                    aria-label="Return to Dashboard"
                    title="Return to Dashboard"
                    tabindex={0}
                >
                    <MdiChevronLeft />
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