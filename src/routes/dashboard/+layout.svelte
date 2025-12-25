<!-- 
  @component This component is the base layout for all dashboard pages.

  It creates the header bar on the top menu and sets up the Navigation drawers.
-->

<script lang="ts">
    import { AppBar, Dialog } from '@skeletonlabs/skeleton-svelte';

    import { navigating, page } from '$app/state';
    import type { RouteId } from '$app/types';
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import BarStats from '$lib/components/app-bar/BarStats.svelte';
    import MetaTags from '$lib/components/MetaTags.svelte';
    import UniModal, { modalCls } from '$lib/components/modals/UniModal.svelte';
    import Navigation from '$lib/components/nav/Navigation.svelte';
    import SettingsNavigation from '$lib/components/nav/SettingsNavigation.svelte';
    import { getSessionContext } from '$lib/context/index.svelte';
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
        "/dashboard/generic-timer":  { label: "Generic Timer" },
        "/dashboard/for-against":    { label: "For and Against Speeches" },
        "/dashboard/vp-roll-call":   { label: "Voting Procedure (Roll Call)" }
    };

    const header = (label: string) => ({ type: "header" as const, label });
    const link = (href: RouteId) => ({ type: "link" as const, href, label: links[href]?.label });
    const navMenu = [
        header("Main"),
        link("/dashboard/roll-call"),
        link("/dashboard/speaker-list"),
        link("/dashboard/points-motions"),
        link("/dashboard/current-motion"),
        header("Utilities"),
        link("/dashboard/generic-timer"),
        link("/dashboard/for-against"),
        link("/dashboard/vp-roll-call"),
    ] as const;
    let thisLinkTitle = $derived(typeof page.route.id == "string" ? links[page.route.id]?.label : undefined);

    let settingsBackdrop = $state(true);
    // When navigating to a different page, reset topic:
    $effect(() => {
        if (navigating.type != null) {
            sessionData.barTopic = undefined;
            sessionData.tabTitleExtras = undefined;
        }
    })
</script>

{#if typeof thisLinkTitle !== "undefined"}
    <MetaTags title="{thisLinkTitle} · CouchMUN" />
    {:else}
    <MetaTags title="CouchMUN" />
{/if}

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar class="preset-ui-header">   
            <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
                <AppBar.Lead>
                    <UniModal
                        title="Dashboard"
                        type="drawerLeft"
                        bind:open={
                            () => openDrawer === "nav",
                            open => openDrawer = open ? "nav" : null
                        }
                    >
                        {#snippet trigger()}
                            <Dialog.Trigger class="btn-icon-std">
                                <MdiMenu />
                            </Dialog.Trigger>
                        {/snippet}
                        {#snippet main({ close })}
                            <Navigation {close} menu={navMenu} />
                        {/snippet}
                    </UniModal>
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
                    <UniModal
                        title="Settings"
                        type="drawerRight"
                        backdropColor={[settingsBackdrop && modalCls.backdrop.color]}
                        bind:open={
                            () => openDrawer === "settings",
                            open => openDrawer = open ? "settings" : null
                        }
                    >
                        {#snippet trigger()}
                            <Dialog.Trigger class="btn-icon-std">
                                <MdiGear />
                            </Dialog.Trigger>
                        {/snippet}
                        {#snippet main({ close })}
                            <SettingsNavigation
                                {close}
                                onAccordionOpenChange={open => settingsBackdrop = !open}
                            />
                        {/snippet}
                    </UniModal>
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