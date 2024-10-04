<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    export let key: string;
    export let attrs: DelegateAttrs | undefined;
    export let height: string | undefined = undefined;
    export let inline: boolean = false;
    export let fallback: "un" | "icon" | "none" | undefined = undefined;

    $: label = attrs?.name ?? key ?? "";
</script>

{#if inline}
<div class="flex items-center gap-1">
    <DelFlag {key} {attrs} height={height ?? "h-4"} fallback={fallback ?? "none"} />
    {label}
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{label}</h2>
    <DelFlag {key} {attrs} height={height ?? "h-[25dvh]"} fallback={fallback ?? "un"} />
</div>
{/if}