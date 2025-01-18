<!--
  @component This component is the base layout for the admin pages on the site.
  
  This basically initializes the admin app bar (the yellow bar on the top).
-->
<script lang="ts">
    import { base } from '$app/paths';
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import { db } from '$lib/db/index.svelte';
    
    import Icon from "@iconify/svelte";
    import { AppBar, LightSwitch } from '@skeletonlabs/skeleton';

    let { children } = $props();
    const title = db.settingStore("title", "");
</script>

<div class="hidden">
    <!-- Needed to make dark mode work reliably cross-tabs -->
    <LightSwitch />
</div>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar 
            background="bg-warning-300-600-token" 
            gridColumns="grid-cols-[auto_1fr_auto]" 
            slotDefault="place-self-center"
            slotTrail="place-content-end"
        >
            {#snippet lead()}
                <a
                    href="{base}/dashboard"
                    class="btn btn-icon"
                    aria-label="Return to Dashboard"
                    title="Return to Dashboard"
                    tabindex={0}
                >
                    <Icon icon="mdi:chevron-left" width="36" height="36" />
                </a>
            {/snippet}
            <div class="flex flex-col gap-1">
                <BarHeader bind:title={$title} />
            </div>
            {#snippet trail()}
                <!-- Alignment spacing -->
                <div class="btn-icon"></div>
            {/snippet}
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children()}
    </main>
</div>