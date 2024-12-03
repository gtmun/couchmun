<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    interface Props {
        key: string;
        attrs: DelegateAttrs | undefined;
        height?: string | undefined;
        inline?: boolean;
        fallback?: "un" | "icon" | "none" | undefined;
    }

    let {
        key,
        attrs,
        height = undefined,
        inline = false,
        fallback = undefined
    }: Props = $props();

    let label = $derived(attrs?.name ?? key ?? "");
</script>

{#if inline}
<div class="flex items-center gap-1">
    <DelFlag {key} {attrs} height={height ?? "h-4"} fallback={fallback ?? "none"} />
    {label}
</div>
{:else}
<div class="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-150">
    <h2 class="h2">{label}</h2>
    <DelFlag {key} {attrs} height={height ?? "h-48"} fallback={fallback ?? "un"} />
</div>
{/if}