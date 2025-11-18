<!-- 
  @component This component is the base layout for all dashboard pages.

  It creates the header bar on the top menu and sets up the Navigation drawers.
-->

<script lang="ts">
    import { AppBar, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

    import { navigating, page } from '$app/state';
    import type { RouteId } from '$app/types';
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import BarStats from '$lib/components/app-bar/BarStats.svelte';
    import MetaTags from '$lib/components/MetaTags.svelte';
    import Navigation from '$lib/components/nav/Navigation.svelte';
    import SettingsNavigation from '$lib/components/nav/SettingsNavigation.svelte';
    import { getSessionContext } from '$lib/context/index.svelte';
    import MdiClose from "~icons/mdi/close";
    import MdiGear from "~icons/mdi/gear";
    import MdiMenu from "~icons/mdi/menu";

    let { children } = $props();
    type DrawerState = "nav" | "settings" | null;
    let openDrawer: DrawerState = $state(null);

    const sessionData = getSessionContext();
    const { delegates, barTitle } = sessionData;
    let delegateCount = $derived($delegates.reduce((acc, d) => acc + +d.isPresent(), 0));

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

    const backdropBase = "fixed inset-0 z-50";
    const backdropColor = "bg-surface-500/50";
    const backdropAnim = "transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100";
    const positionerBase = "fixed inset-0 z-50 flex justify-start";
    const cardBase = "h-screen card bg-surface-50-950 w-sm p-4 space-y-4 shadow-xl";
    const cardAnim = "transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100";
    const cardLeft = "-translate-x-full starting:data-[state=open]:-translate-x-full data-[state=open]:translate-x-0 rounded-l-none";
    const cardRight = "translate-x-[100vw] starting:data-[state=open]:translate-x-[100vw] data-[state=open]:translate-x-[calc(100vw_-_100%)] rounded-r-none";
</script>

{#if typeof thisLink !== "undefined"}
    <MetaTags title="{thisLink.label} · CouchMUN" />
    {:else}
    <MetaTags title="CouchMUN" />
{/if}

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar class="preset-ui-header">   
            <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
                <AppBar.Lead>
                     <Dialog
                        open={openDrawer === "nav"}
                        onOpenChange={e => openDrawer = e.open ? "nav" : null}
                     >
                        <Dialog.Trigger class="btn-icon-std">
                            <MdiMenu />
                        </Dialog.Trigger>
                        <Portal>
                            <Dialog.Backdrop class={[backdropBase, backdropColor, backdropAnim]} />
                            <Dialog.Positioner class={positionerBase}>
                                <Dialog.Content class={[cardBase, cardAnim, cardLeft]}>
                                    <header class="flex justify-between items-center">
                                        <Dialog.Title class="text-2xl font-bold">Dashboard</Dialog.Title>
                                        <Dialog.CloseTrigger class="btn-icon preset-tonal">
                                            <MdiClose />
                                        </Dialog.CloseTrigger>
                                    </header>
                                    <Navigation close={() => openDrawer = null} {links} />
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Portal>
                    </Dialog>
                </AppBar.Lead>
                <AppBar.Headline>
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
                </AppBar.Headline>
                <AppBar.Trail>
                    <!-- Settings -->
                    <Dialog
                        open={openDrawer === "settings"}
                        onOpenChange={e => openDrawer = e.open ? "settings" : null}
                     >
                        <Dialog.Trigger class="btn-icon-std">
                            <MdiGear />
                        </Dialog.Trigger>
                        <Portal>
                            <Dialog.Backdrop class={[backdropBase, settingsBackdrop && backdropColor, backdropAnim]} />
                            <Dialog.Positioner class={positionerBase}>
                                <Dialog.Content class={[cardBase, cardAnim, cardRight]}>
                                    <header class="flex justify-between items-center">
                                        <Dialog.Title class="text-2xl font-bold">Settings</Dialog.Title>
                                        <Dialog.CloseTrigger class="btn-icon preset-tonal">
                                            <MdiClose />
                                        </Dialog.CloseTrigger>
                                    </header>
                                    <SettingsNavigation
                                        close={() => openDrawer = null}
                                        onAccordionOpenChange={open => settingsBackdrop = !open}
                                    />
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Portal>
                    </Dialog>
                </AppBar.Trail>
            </AppBar.Toolbar>
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children?.()}
    </main>
    <!-- Footer -->
    <footer class="preset-ui-header p-4"></footer>
</div>