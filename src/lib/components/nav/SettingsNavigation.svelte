<!-- 
  @component The settings and admin navigation drawer, accessible on the right-hand side of the UI.

  This drawer allows users to visit different **admin** pages and configure various settings on the site.
 -->
<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { getSessionContext, resetSessionContext } from "$lib/context/index.svelte";
    import { db, queryStore } from "$lib/db/index.svelte";
    import MdiOpenInNew from "~icons/mdi/open-in-new";
    import MdiPalette from "~icons/mdi/palette";
    import MdiPlus from "~icons/mdi/plus";
    import MdiWrench from "~icons/mdi/wrench";

    interface Props {
        /**
         * A method callback that "closes" the drawer that 
         * this navigation resides under.
         */
        close: () => void;
    }
    let { close }: Props = $props();

    const prevSessions = queryStore(() => db.prevSessions.toCollection().keys(), []);
    const selectedSession = queryStore(() => db.getSessionValue("sessionKey"));
    const sessionData = getSessionContext();
    
    /**
     * This implements the functionality of the "Add Session" button.
     * Saves the current session and creates a new session.
     */
    async function createNewSession() {
        await db.saveSessionData();
        await resetSessionContext(sessionData);
        goto(`${base}/dashboard/roll-call`);
    }
</script>

<div class="flex p-4 gap-3 items-center">
    <h3 class="h3">Configure</h3>
    <MdiWrench />
</div>
<hr />

<!-- External link to admin pages -->
<nav class="list-nav p-2">
    <ul>
        <a onclick={close} href="{base}/admin/settings" tabindex="0">
            Settings <MdiOpenInNew class="text-surface-500" width="1em" height="1em" />
        </a>
        <a onclick={close} target="_blank" href="{base}/admin/stats" tabindex="0">
            Stats <MdiOpenInNew class="text-surface-500" width="1em" height="1em" />
        </a>
    </ul>
</nav>

<hr />

<!-- Theming -->
<div class="p-4 flex flex-col gap-3">
    <div class="flex gap-3 items-center">
        <h3 class="h3">Theme</h3>
        <MdiPalette />
    </div>
    <div class="flex justify-between">
        Active Theme <LightSwitch />
    </div>
</div>

<hr />

<!-- Session management -->

<!-- A session row, which currently just consists of the "switch to this session" button -->
{#snippet sessionRow(key?: number)}
    {@const selected = $selectedSession === key}
    {@const displayKey = +(key ?? $prevSessions.length) + 1}
    <button
        class="btn {selected ? "preset-filled-primary-500" : "preset-tonal-surface"}"
        onclick={() => { if (typeof key === "number" && !selected) db.loadSessionData(key); }}
        aria-label="Select{selected ? "ed" : ""} Session {displayKey}"
        aria-pressed={selected}
    >
        Session {displayKey}
    </button>
{/snippet}
<div class="p-4 flex flex-col gap-3">
    <div class="grid grid-cols-1 gap-1">
        <!-- All sessions -->
        {#each $prevSessions as sessionKey}
            {@render sessionRow(+sessionKey)}
        {/each}
        {#if typeof $selectedSession === "undefined"}
            {@render sessionRow(undefined)}
        {/if}
    </div>
    <!-- Add session button -->
    <button 
        class="btn preset-tonal-surface border border-surface-500" 
        onclick={createNewSession}
    >
        <MdiPlus />
        Add Session
    </button>
</div>