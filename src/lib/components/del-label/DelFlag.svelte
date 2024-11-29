<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import type { DelegateAttrs } from "$lib/types";
    import Icon from "@iconify/svelte";

    interface Props {
        attrs: DelegateAttrs;
        height?: string;
        fallback?: "un" | "icon" | "none";
    }

    let {
        attrs,
        height = "",
        fallback = "none"
    }: Props = $props();

    // Only set flag on client-side, to prevent hydration mismatch issues.
    // https://svelte.dev/docs/svelte/v5-migration-guide#Other-breaking-changes-img-src-and-html-hydration-mismatches-are-not-repaired
    let flag: URL | undefined = $derived(attrs.flagURL ? new URL(attrs.flagURL) : undefined);
</script>

{#if flag}
    <img
        src={flag.href}
        alt="Flag of {attrs.name}"
        class={height}
    >
{:else if fallback === "un"}
    {#await getFlagUrl("un") then unFallbackFlag}
        <img
            src={unFallbackFlag!.href}
            alt="Flag of {attrs.name} (missing)"
            class={height}
        >   
    {/await}
{:else if fallback === "icon"}
    <!-- HACK: Just don't use this if not inline. -->
    <Icon 
        icon="mdi:flag-off" 
        role="img" 
        aria-label="Flag of {attrs.name} (missing)"
        height={24} 
    />
{:else}
    <!-- do nothing -->
{/if}