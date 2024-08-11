<script lang="ts">
    import BarStats from '$lib/dashboard/BarStats.svelte';
    import BarTitle from '$lib/dashboard/BarTitle.svelte';
    import Navigation from '$lib/dashboard/Navigation.svelte';
    import type { DelegatePresence, SessionData } from '$lib/dashboard/types';
    import delegates from '$lib/delegate_presets/un_delegates.json';
    import Icon from "@iconify/svelte";
    import { AppBar, Drawer, getDrawerStore, LightSwitch } from '@skeletonlabs/skeleton';
    import { setContext } from 'svelte';
    import { derived, readable, writable } from 'svelte/store';

    let title = "General Assembly";

    const drawerStore = getDrawerStore();
    function openNav() {
        drawerStore.open({
            width: 'w-[280px] md:w-[480px]',
        });
    }

    const { presentDelegates } = setContext<SessionData>("sessionData", (() => {
        const delegateAttendance = writable<Record<string, DelegatePresence>>({});
        const presentDelegates = derived(delegateAttendance, $att => {
            return Object.keys($att).filter(k => $att[k] !== "NP");
        });

        return {
            delegateAttributes: readable(delegates), // this'll probably be a writable store later
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
    <Navigation close={drawerStore.close} />
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
                <!-- <button class="btn-icon">
                    <Icon icon="mdi:gear" width="24" height="24" />
                </button> -->
                <LightSwitch />
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
  