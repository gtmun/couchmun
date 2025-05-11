<!-- 
  @component This component is the base layout for all dashboard pages.

  It creates the header bar on the top menu and sets up the Navigation drawers.
-->

<script lang="ts">
    import { navigating, page } from '$app/state';
    import MetaTags from '$lib/components/MetaTags.svelte';
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import BarStats from '$lib/components/app-bar/BarStats.svelte';
    import Navigation from '$lib/components/nav/Navigation.svelte';
    import SettingsNavigation from '$lib/components/nav/SettingsNavigation.svelte';
    import { getSessionContext } from '$lib/context/index.svelte';
    
    import { AppBar } from '@skeletonlabs/skeleton-svelte';
    import MdiMenu from "~icons/mdi/menu";
    import MdiGear from "~icons/mdi/gear";

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

    const sessionData = getSessionContext();
    const { delegates, barTitle } = sessionData;
    let delegateCount = $derived($delegates.reduce((acc, d) => acc + d.isPresent(), 0));

    const links: Record<string, { label: string }> = {
        "/dashboard/roll-call":      { label: "Roll Call" },
        "/dashboard/speaker-list":   { label: "Speakers List" },
        "/dashboard/points-motions": { label: "Points and Motions" },
        "/dashboard/current-motion": { label: "Current Motion" },
        "/dashboard/utilities":      { label: "Utilities" },
    };
    let thisLink = $derived(typeof page.route.id == "string" ? links[page.route.id] : undefined);

    // When navigating to a different page, reset topic:
    $effect(() => {
        if (navigating.type != null) sessionData.barTopic = undefined;
    })
</script>

{#if typeof thisLink !== "undefined"}
    <MetaTags title="{thisLink.label} · CouchMUN" />
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
            background="bg-surface-300-700" 
            toolbarGridCols="grid-cols-[auto_1fr_auto]" 
            centerClasses="place-self-center"
            trailClasses="place-content-end"
        >
            {#snippet lead()}
                <!-- Hamburger menu button -->
                <button
                    class="btn-icon"
                    onclick={openNav}
                    data-label="Pages"
                    title="Pages"
                >
                    <MdiMenu />
                </button>
            {/snippet}
            <!--
                Committee & topic title
                if committeeMain == true: the committee title are front and center
                if commiteeMain == false: the committee title are relegated for something else
            -->
            {@const committeeMain = !sessionData.barTopic}
            <div class="flex flex-col items-center gap-2">
                <div
                    class="flex max-sm:flex-col gap-1 items-stretch"
                    class:flex-col={committeeMain}
                >
                    <BarHeader bind:title={$barTitle} size={committeeMain ? "md" : "sm"} />
                    <div class="border-2 border-surface-900-100 {committeeMain ? "m-1 mt-0" : "mx-4"}" role="separator"></div>
                    <div class="flex items-center justify-center">
                        <BarStats total={delegateCount} />
                    </div>
                </div>
                {#if sessionData.barTopic}
                    <BarHeader bind:title={sessionData.barTopic} styles="italic capitalize" />
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
                    <MdiGear />
                </button>
            {/snippet}
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children?.()}
    </main>
    <!-- Footer -->
    <footer class="bg-surface-300-700 p-4"></footer>
</div>