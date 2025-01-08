<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { getSessionContext, resetSessionContext } from "$lib/context/index.svelte";
    import { db, queryStore } from "$lib/db/index.svelte";
    
    import Icon from "@iconify/svelte";
    import { LightSwitch } from "@skeletonlabs/skeleton";

    interface Props {
        close: () => void;
    }
    let { close }: Props = $props();

    const prevSessions = queryStore(() => db.prevSessions.toCollection().keys(), []);
    const selectedSession = queryStore(() => db.getSessionValue("sessionKey"));
    const sessionData = getSessionContext();
    
    async function clearSession() {
        await db.saveSessionData();
        await resetSessionContext(sessionData);
        goto(`${base}/dashboard/roll-call`);
    }
</script>

<div class="flex p-4 gap-3 items-center">
    <h3 class="h3">Configure</h3>
    <Icon icon="mdi:wrench" width="24" height="24" />
</div>
<hr />

<nav class="list-nav p-2">
    <ul>
        <a onclick={close} href="{base}/admin/settings" tabindex="0">
            Settings&nbsp;<Icon icon="mdi:open-in-new" class="text-surface-400-500-token" />
        </a>
        <a onclick={close} target="_blank" href="{base}/admin/stats" tabindex="0">
            Stats&nbsp;<Icon icon="mdi:open-in-new" class="text-surface-400-500-token" />
        </a>
    </ul>
</nav>

<hr />

<div class="p-4 flex flex-col gap-3">
    <div class="flex gap-3 items-center">
        <h3 class="h3">Theme</h3>
        <Icon icon="mdi:palette" width="24" height="24" />
    </div>
    <div class="flex justify-between">
        Active Theme <LightSwitch />
    </div>
</div>

<hr />

{#snippet sessionRow(key?: number)}
    {@const selected = $selectedSession === key}
    <button
        class="btn {selected ? "variant-filled-primary" : "variant-soft-surface"}"
        onclick={() => { if (typeof key === "number" && !selected) db.loadSessionData(key); }}
    >
        Session {+(key ?? $prevSessions.length) + 1}
    </button>
    <div>
        <!-- Buttons -->
    </div>
{/snippet}
<div class="p-4 flex flex-col gap-3">
    <div class="grid grid-cols-1 gap-1">
        {#each $prevSessions as sessionKey}
            {@render sessionRow(+sessionKey)}
        {/each}
        {#if typeof $selectedSession === "undefined"}
            {@render sessionRow(undefined)}
        {/if}
    </div>
    <button 
        class="btn variant-ghost-surface" 
        onclick={clearSession}
    >
        <Icon icon="mdi:plus" width="24" height="24" />
        Add Session
    </button>
</div>