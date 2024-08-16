<script lang="ts">
    import { base } from "$app/paths";
    import Icon from "@iconify/svelte";
    import { LightSwitch } from "@skeletonlabs/skeleton";

    export let close: () => void;

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