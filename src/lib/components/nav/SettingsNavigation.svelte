<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { getSessionDataContext, resetSessionDataContext } from "$lib/stores/session";
    import { triggerConfirmModal } from "$lib/util";

    import Icon from "@iconify/svelte";
    import { getModalStore, LightSwitch } from "@skeletonlabs/skeleton";

    export let close: () => void;

    const sessionData = getSessionDataContext();
    const modalStore = getModalStore();
    
    function clearSession() {
        close();
        triggerConfirmModal(modalStore,
            "Are you sure you want to reset the session?", 
            () => {
                resetSessionDataContext(sessionData);
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

<div class="p-2 list-nav">
    <a on:click={close} href="{base}/settings">Open Settings</a>
</div>

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
        on:click={clearSession}
    >
        Clear Session
    </button>
</div>