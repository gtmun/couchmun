<!-- 
  @component A wrapper around flag images.

  This handles accessibility and differences between inline/non-inline flags.
  This is used with `DelLabel` to handle the display of delegates.
-->
<script lang="ts">
    import { onMount } from "svelte";
    import type { ClassValue } from "svelte/elements";

    import { getFlagCodes, getFlagUrl } from "$lib/flags/flagcdn";
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
        fallback = "none",
        inline = false
    }: Props = $props();

    const IMG_SIZE_CLASSES = "size-full object-contain";
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

<script module lang="ts">
    // 4:3 ratio for FlagCDN
    export const SIZE_CLASSES_INLINE: ClassValue = "size-5.5 empty:hidden";
    export const SIZE_CLASSES_DISPLAY: ClassValue = "h-[25dvh] w-4/5 empty:hidden";
</script>

{#if _flagURL}
    <img
        src={_flagURL}
        alt=""
        class={IMG_SIZE_CLASSES}
    >
{:else if fallback === "un"}
    <img
        src={getFlagUrl("un", false)!.toString()}
        alt=""
        class={IMG_SIZE_CLASSES}
    >
{:else if fallback === "icon"}
    <!-- HACK: Just don't use this if not inline. -->
    <MdiFlagOff role="none" preserveAspectRatio="xMinYMin meet" />
{:else}
    <!-- do nothing -->
{/if}