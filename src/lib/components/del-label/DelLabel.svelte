<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    interface Props {
        attrs: DelegateAttrs;
        height?: string | undefined;
        inline?: boolean;
        fallback?: "un" | "icon" | "none" | undefined;
    }

    let {
        attrs,
        height = undefined,
        inline = false,
        fallback = undefined
    }: Props = $props();

</script>

{#if inline}
<div class="flex items-center gap-1">
    <DelFlag {attrs} height={height ?? "h-4"} fallback={fallback ?? "none"} />
    {attrs.name}
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{attrs.name}</h2>
    <DelFlag {attrs} height={height ?? "h-48"} fallback={fallback ?? "un"} />
</div>
{/if}