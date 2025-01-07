<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import Icon from "@iconify/svelte";

    interface Props {
        label: string,
        url: string | undefined,
        height?: string;
        fallback?: "un" | "icon" | "none";
        inline?: boolean
    }

    let {
        label,
        url,
        height = "",
        fallback = "none",
        inline = false
    }: Props = $props();

    // Only set flag on client-side, to prevent hydration mismatch issues.
    // https://svelte.dev/docs/svelte/v5-migration-guide#Other-breaking-changes-img-src-and-html-hydration-mismatches-are-not-repaired
    let flag: URL | undefined = $derived(url ? new URL(url) : undefined);

    /**
     * Hack to implement fixed flags for FlagCDN flags.
     */
    function _legacyFixedFlagSrc(url: URL) {
        const match = url.href.match(/^https:\/\/flagcdn.com\/(\w+).svg$/);
        if (inline && match) {
            return `https://flagcdn.com/80x60/${match[1]}.png`;
        } else {
            return url.href;
        }
    }
</script>

{#if flag}
    <!-- Temporary HACK to support fixed-size flags from FlagCDN -->
    {@const src = _legacyFixedFlagSrc(flag)}
    <img
        {src}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un"}
    {#await getFlagUrl("un") then unFallbackFlag}
        <img
            src={unFallbackFlag!.href}
            alt="Flag of {label} (missing)"
            class={height}
        >   
    {/await}
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