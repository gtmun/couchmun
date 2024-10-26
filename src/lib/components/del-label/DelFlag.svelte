<script lang="ts">
    import { browser } from "$app/environment";
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import type { DelegateAttrs } from "$lib/types";
    import Icon from "@iconify/svelte";

    export let key: string;
    export let height: string = "";
    export let attrs: DelegateAttrs | undefined;
    export let fallback: "un" | "icon" | "none" = "none";

    // Load flags on client-side, rather than server-side
    let flag: URL | undefined = undefined;
    let unFallbackFlag: URL | undefined = undefined;
    $: if (browser) {
        (async () => {
            flag = attrs?.flagURL ? new URL(attrs.flagURL) : await getFlagUrl(key);
            unFallbackFlag = await getFlagUrl("un");
        })()
    }

    $: label = attrs?.name ?? key ?? "";
</script>

{#if flag}
    <img
        src={flag.href}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un" && unFallbackFlag}
    <img
        src={unFallbackFlag.href}
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