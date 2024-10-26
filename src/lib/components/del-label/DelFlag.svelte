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

    // Only set flag on client-side, to prevent hydration mismatch issues.
    // https://svelte.dev/docs/svelte/v5-migration-guide#Other-breaking-changes-img-src-and-html-hydration-mismatches-are-not-repaired
    let flag: URL | undefined = $state();
    $effect(() => {
        flag = attrs?.flagURL ? new URL(attrs.flagURL) : getFlagUrl(key);
    });

    let label = $derived(attrs?.name ?? key ?? "");
</script>

{#if flag}
    <img
        src={flag.href}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un"}
    <img
        src={getFlagUrl("un")!.href}
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