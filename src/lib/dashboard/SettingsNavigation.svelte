<script lang="ts">
    import { base } from "$app/paths";
    import { resetSessionDataContext, SESSION_DATA_KEY } from "$lib/dashboard/stores";
    import Icon from "@iconify/svelte";
    import { getModalStore, LightSwitch, type ModalSettings } from "@skeletonlabs/skeleton";
    import type { SessionData } from "./types";
    import { getContext } from "svelte";

    export let close: () => void;

    const sessionData = getContext<SessionData>(SESSION_DATA_KEY);
    const modalStore = getModalStore();
    
    function modalAction(body: string, successCallback: () => void, errorCallback: () => void = () => {}) {
        const modal: ModalSettings = {
            type: "confirm",
            title: "Confirm",
            body,
            response: (r: boolean) => r ? successCallback() : errorCallback(),
        };
        modalStore.trigger(modal);
    }
    function clearSession() {
        close();
        modalAction("Are you sure you want to reset the session?", () => {
            resetSessionDataContext(sessionData);
        })
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
    <a 
        class="btn variant-filled-error" 
        on:click={clearSession}
        href="{base}/dashboard/roll-call"
    >
        Clear Session
    </a>
</div>