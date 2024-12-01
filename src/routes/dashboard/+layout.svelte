<script lang="ts">
    import { navigating, page } from '$app/stores';
    import MetaTags from '$lib/components/MetaTags.svelte';
    import BarStats from '$lib/components/app-bar/BarStats.svelte';
    import BarTitle from '$lib/components/app-bar/BarTitle.svelte';
    import Navigation from '$lib/components/nav/Navigation.svelte';
    import SettingsNavigation from '$lib/components/nav/SettingsNavigation.svelte';
    import { db, queryStore } from '$lib/db';
    import { getSessionDataContext } from '$lib/stores/session';
    import type { AppBarData } from '$lib/types';
    import { isPresent } from '$lib/util';
    
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
    import { setContext } from 'svelte';

    let { children } = $props();
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

    const { settings: { title } } = getSessionDataContext();
    let delegateCount = queryStore(() => db.delegates.filter(d => d.enabled && isPresent(d.presence)).count(), 0);

    const links: Record<string, { label: string }> = {
        "/dashboard/roll-call":      { label: "Roll Call" },
        "/dashboard/speaker-list":   { label: "Speakers List" },
        "/dashboard/points-motions": { label: "Points and Motions" },
        "/dashboard/current-motion": { label: "Current Motion" },
        "/dashboard/utilities":      { label: "Utilities" },
    };
    let thisLink = $derived(typeof $page.route.id == "string" ? links[$page.route.id] : undefined);

    // This can be set to change the topic displayed on the app bar.
    // This must be cleared when navigating to different pages.
    const appBarData: AppBarData = $state({
        topic: undefined
    });
    setContext("app-bar", appBarData);
    $effect(() => {
        if ($navigating) appBarData.topic = undefined;
    })
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
            {#snippet lead()}
                <!-- Hamburger menu button -->
                <button
                    class="btn-icon"
                    onclick={openNav}
                    data-label="Pages"
                    title="Pages"
                >
                    <Icon icon="mdi:menu" width="24" height="24" />
                </button>
            {/snippet}
            <!--
                Committee & topic title
                if committeeMain == true: the committee title are front and center
                if commiteeMain == false: the committee title are relegated for something else
            -->
            {@const committeeMain = !appBarData.topic}
            <div class="flex flex-col items-center gap-3">
                <div
                    class="flex max-sm:flex-col gap-1 items-stretch"
                    class:flex-col={committeeMain}
                >
                    <BarTitle bind:title={$title} size={committeeMain ? "md" : "sm"} />
                    <div class="border-2 m-1 mt-0 border-surface-800-100-token" role="separator"></div>
                    <div class="flex items-center justify-center">
                        <BarStats total={$delegateCount} />
                    </div>
                </div>
                {#if appBarData.topic}
                    <h2 class="h2 capitalize text-center"><i>Topic: {appBarData.topic}</i></h2>
                {/if}
            </div>
            {#snippet trail()}
                <!-- Settings -->
                <button
                    class="btn-icon"
                    onclick={openSettings}
                    data-label="Settings"
                    title="Settings"
                >
                    <Icon icon="mdi:gear" width="24" height="24" />
                </button>
            {/snippet}
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children?.()}
    </main>
    <!-- Footer -->
    <footer class="bg-surface-300-600-token p-4"></footer>
</div>