<script lang="ts">
    import { base } from '$app/paths';
    import BarTitle from '$lib/components/app-bar/BarTitle.svelte';
    import { getSessionDataContext } from '$lib/stores/session';
    
    import Icon from "@iconify/svelte";
    import { AppBar, LightSwitch } from '@skeletonlabs/skeleton';

    const { settings: { title } } = getSessionDataContext();
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
            <svelte:fragment slot="lead">
                <a
                    href="{base}/dashboard"
                    class="btn btn-icon"
                    aria-label="Return to Dashboard"
                    title="Return to Dashboard"
                >
                    <Icon icon="mdi:chevron-left" width="36" height="36" />
                </a>
            </svelte:fragment>
            <div class="flex flex-col gap-1">
                <BarTitle bind:title={$title} />
            </div>
            <svelte:fragment slot="trail">
                <!-- Alignment spacing -->
                <div class="btn-icon" />
            </svelte:fragment>
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        <slot></slot>
    </main>
</div>