<script lang="ts">
    import BarStats from '$lib/dashboard/BarStats.svelte';
    import BarTitle from '$lib/dashboard/BarTitle.svelte';
    import Navigation from '$lib/dashboard/Navigation.svelte';
    import SettingsNavigation from '$lib/dashboard/SettingsNavigation.svelte';
    import { createSessionDataContext } from '$lib/stores/session';
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';

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
</script>

<!-- Navigation drawer -->
<Drawer>
    {#if $drawerStore.id === "navigation"}
        <Navigation close={drawerStore.close} />
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
                <button class="btn-icon" on:click={openNav}>
                    <Icon icon="mdi:menu" width="24" height="24" />
                </button>
            </svelte:fragment>
            <div class="flex flex-col gap-1">
                <BarTitle bind:title={$title} />
                <hr class="divider border-t-4 border-surface-800-100-token" />
                <BarStats total={$presentDelegates.length} />
            </div>
            <svelte:fragment slot="trail">
                <!-- Settings -->
                <button class="btn-icon" on:click={openSettings}>
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
  