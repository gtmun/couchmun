<script lang="ts">
    import { navigating, page } from '$app/stores';
    import MetaTags from '$lib/components/MetaTags.svelte';
    import BarStats from '$lib/components/app-bar/BarStats.svelte';
    import BarTitle from '$lib/components/app-bar/BarTitle.svelte';
    import Navigation from '$lib/components/nav/Navigation.svelte';
    import SettingsNavigation from '$lib/components/nav/SettingsNavigation.svelte';
    import { createSessionDataContext } from '$lib/stores/session';
    import type { AppBarData } from '$lib/types';
    
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';

    const drawerStore = getDrawerStore();
    function openNav() {
        drawerStore.open({
            id: "navigation",
            width: 'w-[280px] md:w-[480px]',
            position: "left"
        });
    }
    function openSettings() {
        drawerStore.open({
            id: "settings",
            width: 'w-[280px] md:w-[480px]',
            position: "right"
        })
    }

    const { settings: { title }, presentDelegates } = createSessionDataContext();

    const links: Record<string, { label: string }> = {
        "/dashboard/roll-call":      { label: "Roll Call" },
        "/dashboard/speaker-list":   { label: "Speakers List" },
        "/dashboard/points-motions": { label: "Points and Motions" },
        "/dashboard/current-motion": { label: "Current Motion" },
        "/dashboard/utilities":      { label: "Utilities" },
    };
    $: thisLink = typeof $page.route.id == "string" ? links[$page.route.id] : undefined;

    // This can be set to change the topic displayed on the app bar.
    // This must be cleared when navigating to different pages.
    const { topic } = setContext<AppBarData>("app-bar", {
        topic: writable(undefined)
    });
    $: if ($navigating) topic.set(undefined);
</script>

{#if typeof thisLink !== "undefined"}
    <MetaTags title="{thisLink.label} &middot; CouchMUN" />
    {:else}
    <MetaTags title="CouchMUN" />
{/if}

<!-- Navigation drawer -->
<Drawer>
    {#if $drawerStore.id === "navigation"}
        <Navigation close={drawerStore.close} {links} />
        {:else if $drawerStore.id === "settings"}
        <SettingsNavigation close={drawerStore.close} />
    {/if}
</Drawer>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar 
            background="bg-surface-300-600-token" 
            gridColumns="grid-cols-[auto_1fr_auto]" 
            slotDefault="place-self-center"
            slotTrail="place-content-end"
        >
            <svelte:fragment slot="lead">
                <!-- Hamburger menu button -->
                <button
                    class="btn-icon"
                    on:click={openNav}
                    data-label="Pages"
                    title="Pages"
                >
                    <Icon icon="mdi:menu" width="24" height="24" />
                </button>
            </svelte:fragment>
            <div class="flex flex-col gap-1">
                <BarTitle bind:title={$title} />
                <hr class="divider border-t-4 border-surface-800-100-token" />
                <BarStats total={$presentDelegates.length} />
                {#if $topic}
                    <h3 class="h3 capitalize self-center mt-3"><i>Topic: {$topic}</i></h3>
                {/if}
            </div>
            <svelte:fragment slot="trail">
                <!-- Settings -->
                <button
                    class="btn-icon"
                    on:click={openSettings}
                    data-label="Settings"
                    title="Settings"
                >
                    <Icon icon="mdi:gear" width="24" height="24" />
                </button>
            </svelte:fragment>
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        <slot></slot>
    </main>
    <!-- Footer -->
    <footer class="bg-surface-300-600-token p-4"></footer>
  </div>
  