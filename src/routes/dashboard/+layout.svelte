<script lang="ts">
    import BarStats from '$lib/dashboard/BarStats.svelte';
    import BarTitle from '$lib/dashboard/BarTitle.svelte';
    import Navigation from '$lib/dashboard/Navigation.svelte';
    import SettingsNavigation from '$lib/dashboard/SettingsNavigation.svelte';
    import type { AccessibleSettings, DelegatePresence, SessionData, Settings } from '$lib/dashboard/types';
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
    import { getContext, setContext } from 'svelte';
    import { derived, readonly, writable } from 'svelte/store';

    let title = "General Assembly";

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

    const settings = getContext<Settings>("settings");
    const accessibleSettings: AccessibleSettings = {
        delegateAttributes: derived([settings.delegateAttributes, settings.delegatesEnabled], 
            ([$attrs, $enables]) => Object.fromEntries(Object.entries($attrs).filter(([k]) => $enables[k] ?? false))
        ),
        sortOrder: readonly(settings.sortOrder)
    };
    const { presentDelegates } = setContext<SessionData>("sessionData", (() => {
        const delegateAttendance = writable<Record<string, DelegatePresence>>({});
        const presentDelegates = derived(delegateAttendance, $att => {
            return Object.keys($att).filter(k => $att[k] !== "NP");
        });

        return {
            settings: accessibleSettings,
            delegateAttendance,
            presentDelegates,
            motions: writable([]),
            selectedMotion: writable(),
            speakersList: writable([])
        }
    })());
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
                <BarTitle bind:title />
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
    <footer class="bg-surface-300-600-token p-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus. (footer)</footer>
  </div>
  