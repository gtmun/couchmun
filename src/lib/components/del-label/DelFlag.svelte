<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import type { DelegateAttrs } from "$lib/types";
    import Icon from "@iconify/svelte";

    export let key: string;
    export let height: string = "";
    export let attrs: DelegateAttrs | undefined;
    export let fallback: "un" | "icon" | "none" = "none";

    $: flag = attrs?.flagURL ? new URL(attrs?.flagURL) : getFlagUrl(key);
    $: label = attrs?.name ?? key ?? "";

    function getUNFlag() {
        return getFlagUrl("un")!;
    }
</script>

{#if flag}
    <img
        src={flag.toString()}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un"}
    <img
        src={getUNFlag().toString()}
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