<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import type { DelegateAttrs } from "$lib/types";
    import Icon from "@iconify/svelte";

    interface Props {
        key: string;
        height?: string;
        attrs: DelegateAttrs | undefined;
        fallback?: "un" | "icon" | "none";
    }

    let {
        key,
        height = "",
        attrs,
        fallback = "none"
    }: Props = $props();

    let flag = $derived(attrs?.flagURL ? new URL(attrs?.flagURL) : getFlagUrl(key));
    let label = $derived(attrs?.name ?? key ?? "");
</script>

{#if flag}
    <img
        src={flag.toString()}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un"}
    <img
        src={getFlagUrl("un")!.toString()}
        alt="Flag of {label} (missing)"
        class={height}
    >
{:else if fallback === "icon"}
    <!-- HACK: Just don't use this if not inline. -->
    <Icon 
        icon="mdi:flag-off" 
        role="img" 
        aria-label="Flag of {label} (missing)"
        height={24} 
    />
{:else}
    <!-- do nothing -->
{/if}