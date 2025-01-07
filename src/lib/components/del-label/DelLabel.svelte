<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    interface Props {
        attrs: DelegateAttrs | undefined;
        height?: string | undefined;
        inline?: boolean;
        fallbackFlag?: "un" | "icon" | "none" | undefined;
        fallbackName?: string | undefined;
    }

    let {
        attrs,
        height = undefined,
        inline = false,
        fallbackFlag = undefined,
        fallbackName = undefined
    }: Props = $props();

    let label = $derived(attrs?.name ?? fallbackName ?? "");
</script>

{#if inline}
<div class="flex items-center gap-1">
    <DelFlag {label} url={attrs?.flagURL} height={height ?? "h-4"} fallback={fallbackFlag ?? "none"} />
    <span class="text-left">{label}</span>
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{label}</h2>
    <DelFlag {label} url={attrs?.flagURL} height={height ?? "h-[25dvh]"} fallback={fallbackFlag ?? "un"} />
</div>
{/if}