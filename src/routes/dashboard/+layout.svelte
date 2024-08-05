<script lang="ts">
    import BarTitle from '$lib/dashboard/BarTitle.svelte';
    import Navigation from '$lib/dashboard/Navigation.svelte';
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore, LightSwitch } from '@skeletonlabs/skeleton';

    let title = "General Assembly";

    const drawerStore = getDrawerStore();
    function openNav() {
        drawerStore.open({
            width: 'w-[280px] md:w-[480px]',
        });
    }
</script>

<!-- Navigation drawer -->
<Drawer>
    <Navigation close={drawerStore.close} />
</Drawer>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
            <svelte:fragment slot="lead">
                <!-- Hamburger menu button -->
                <button class="btn-icon" on:click={openNav}>
                    <Icon icon="mdi:menu" width="24" height="24" />
                </button>
            </svelte:fragment>
            <BarTitle bind:title />
            <svelte:fragment slot="trail">
                <!-- Settings -->
                <!-- <button class="btn-icon">
                    <Icon icon="mdi:gear" width="24" height="24" />
                </button> -->
                <LightSwitch />
            </svelte:fragment>
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-scroll">
        <slot></slot>
    </main>
    <!-- Footer -->
    <footer class="bg-surface-100-800-token p-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus. (footer)</footer>
  </div>
  