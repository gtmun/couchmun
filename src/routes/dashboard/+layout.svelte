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
    
    import { AppBar, Modal } from '@skeletonlabs/skeleton-svelte';
    import MdiMenu from "~icons/mdi/menu";
    import MdiGear from "~icons/mdi/gear";
    import type { RouteId } from '$app/types';

    let { children } = $props();
    type DrawerState = "nav" | "settings" | null;
    let openDrawer: DrawerState = $state(null);

    const sessionData = getSessionContext();
    const { delegates, barTitle } = sessionData;
    let delegateCount = $derived($delegates.reduce((acc, d) => acc + d.isPresent(), 0));

    const links: Partial<Record<RouteId, { label: string }>> = {
        "/dashboard/roll-call":      { label: "Roll Call" },
        "/dashboard/speaker-list":   { label: "Speakers List" },
        "/dashboard/points-motions": { label: "Points and Motions" },
        "/dashboard/current-motion": { label: "Current Motion" },
        "/dashboard/utilities":      { label: "Utilities" },
    };
    let thisLink = $derived(typeof page.route.id == "string" ? links[page.route.id] : undefined);

    let settingsBackdrop = $state(true);
    // When navigating to a different page, reset topic:
    $effect(() => {
        if (navigating.type != null) {
            sessionData.barTopic = undefined;
            sessionData.tabTitleExtras = undefined;
        }
    })
</script>

{#if typeof thisLink !== "undefined"}
    <MetaTags title="{thisLink.label} · CouchMUN" />
    {:else}
    <MetaTags title="CouchMUN" />
{/if}

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar 
            background="preset-ui-header" 
            toolbarGridCols="grid-cols-[auto_1fr_auto]" 
            leadClasses="items-center"
            headlineClasses="place-self-center"
            trailClasses="items-center place-content-end"
        >
            {#snippet lead()}
                <!-- Hamburger menu button -->
                <Modal
                    open={openDrawer === "nav"}
                    onOpenChange={e => openDrawer = e.open ? "nav" : null}
                    triggerBase="btn-icon-std"
                    contentBase="bg-surface-50-950 p-4 space-y-4 shadow-xl w-[280px] md:w-[480px] h-screen"
                    backdropBackground="bg-surface-500/50"
                    positionerJustify="justify-start"
                    positionerAlign=""
                    positionerPadding=""
                    transitionsPositionerIn={{ x: -480, duration: 200 }}
                    transitionsPositionerOut={{ x: -480, duration: 200 }}
                    aria-label="Pages"
                >
                    {#snippet trigger()}
                        <MdiMenu />
                    {/snippet}
                    {#snippet content()}
                        <Navigation close={() => openDrawer = null} {links} />
                    {/snippet}
                </Modal>
            {/snippet}
            <!--
                Committee & topic title
                if committeeMain == true: the committee title are front and center
                if commiteeMain == false: the committee title are relegated for something else
            -->
            {@const committeeMain = !sessionData.barTopic}
            <div class="flex flex-col items-center gap-2">
                <div class={["flex max-sm:flex-col gap-1 items-stretch", committeeMain && "flex-col"]}>
                    <BarHeader bind:title={$barTitle} size={committeeMain ? "md" : "sm"} />
                    <div class={["border-2 rounded border-primary-900-100", committeeMain ? "m-1 mt-0" : "mx-4"]} role="separator"></div>
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
                <Modal
                    open={openDrawer === "settings"}
                    onOpenChange={e => openDrawer = e.open ? "settings" : null}
                    triggerBase="btn-icon-std"
                    contentBase="bg-surface-50-950 p-4 space-y-4 shadow-xl w-[280px] md:w-[480px] h-screen"
                    backdropBackground="transition-colors {settingsBackdrop ? "bg-surface-500/50" : ''}"
                    positionerJustify="justify-end"
                    positionerAlign=""
                    positionerPadding=""
                    transitionsPositionerIn={{ x: 480, duration: 200 }}
                    transitionsPositionerOut={{ x: 480, duration: 200 }}
                    aria-label="Settings"
                >
                    {#snippet trigger()}
                        <MdiGear />
                    {/snippet}
                    {#snippet content()}
                        <SettingsNavigation
                            close={() => openDrawer = null}
                            bind:showBackdrop={settingsBackdrop}
                        />
                    {/snippet}
                </Modal>
            {/snippet}
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children?.()}
    </main>
    <!-- Footer -->
    <footer class="preset-ui-header p-4"></footer>
</div>