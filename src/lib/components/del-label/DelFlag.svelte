<!-- 
  @component A wrapper around flag images.

  This handles accessibility and differences between inline/non-inline flags.
  This is used with `DelLabel` to handle the display of delegates.
-->
<script lang="ts">
    import { getFlagCodes, getFlagUrl } from "$lib/flags/flagcdn";
    import { onMount } from "svelte";
    import type { ClassValue } from "svelte/elements";
    import MdiFlagOff from "~icons/mdi/flag-off";

    interface Props {
        /**
         * Country's name. This is necessary for accessibilities purposes.
         */
        label: string,
        /**
         * The link to the flag's URL. 
         * 
         * This is *preferably* an SVG, but can also be PNG.
         * Currently, this should be a link to an image from `flagcdn.com`.
         */
        url: string | undefined,
        /**
         * The height of the flag, which should be defined with Tailwind CSS classes.
         */
        height?: ClassValue;
        /**
         * The fallback if the URL provided doesn't exist.
         * - `un`: Fallback to the United Nations flag
         * - `icon`: Fallback to a broken flag icon (this should only be used for inline, small flags)
         * - `none`: Fallback to nothing. A blank space.
         */
        fallback?: "un" | "icon" | "none";
        /**
         * Whether this flag is inline with the text or not.
         * 
         * If enabled and using a FlagCDN flag, this will overwrite the flag with a special inline version.
         */
        inline?: boolean
    }

    let {
        label,
        url: flagURL,
        height = "",
        fallback = "none",
        inline = false
    }: Props = $props();

    let _flagCodes: Record<string, string> = $state({});
    onMount(async () => {
        Object.assign(_flagCodes, await getFlagCodes());
    });
    /**
     * Hack to implement fixed flags for FlagCDN flags + fallback to national flags.
     */
    function _legacyFixedFlagSrc(url: string | undefined, label: string, inline: boolean) {
        if (!url) {
            let key = Object.keys(_flagCodes)
                .find(k => _flagCodes[k].localeCompare(label, undefined, { sensitivity: "base" }) == 0);
            if (key) {
                url = getFlagUrl(key, false)!.toString();
            }
        }

        let match;
        if (inline && (match = url?.match(/^https:\/\/flagcdn.com\/(\w+).svg\/?$/))) {
            return `https://flagcdn.com/80x60/${match[1]}.png`;
        } else {
            return url;
        }
    }
    let _flagURL = $derived(_legacyFixedFlagSrc(flagURL, label, inline));
</script>

{#if _flagURL}
    <img
        src={_flagURL}
        alt="Flag of {label}"
        class={height}
    >
{:else if fallback === "un"}
    <img
        src={getFlagUrl("un", false)!.toString()}
        alt="Flag of {label} (missing)"
        class={height}
    >
{:else if fallback === "icon"}
    <!-- HACK: Just don't use this if not inline. -->
    <MdiFlagOff 
        role="img" 
        aria-label="Flag of {label} (missing)"
    />
{:else}
    <!-- do nothing -->
{/if}