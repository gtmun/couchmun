<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { getSessionContext, resetSessionContext } from "$lib/context/index.svelte";
    import { triggerConfirmModal } from "$lib/util";

    import Icon from "@iconify/svelte";
    import { getModalStore, LightSwitch } from "@skeletonlabs/skeleton";

    interface Props {
        close: () => void;
    }
    let { close }: Props = $props();

    const sessionData = getSessionContext();
    const modalStore = getModalStore();
    
    function clearSession() {
        close();
        triggerConfirmModal(modalStore,
            "Are you sure you want to reset the session?", 
            async () => {
                await resetSessionContext(sessionData);
                goto(`${base}/dashboard/roll-call`);
            }
        )
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

<div class="p-4 flex flex-col gap-3">
    <button 
        class="btn variant-ghost-error" 
        onclick={clearSession}
    >
        Clear Session
    </button>
</div>