<!-- 
  @component A wrapper that displays a delegate's name and their flag.

  This handles accessibility and differences between inline/non-inline labels.
-->

<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    interface Props {
        /**
         * The attributes of the delegate
         * (this can be undefined to indicate no delegate).
         */
        attrs: DelegateAttrs | undefined;
        /**
         * Height of the flag, defined with Tailwind CSS classes.
         */
        flagHeight?: string | undefined;
        /**
         * Whether this label is inline text or not.
         * This decides whether it is a large block or text with a flag.
         */
        inline?: boolean;
        /**
         * The `fallback` property of `DelFlag`.
         */
        fallbackFlag?: "un" | "icon" | "none" | undefined;
        /**
         * The name to use if the delegate's name could not be found.
         */
        fallbackName?: string | undefined;
    }

    let {
        attrs,
        flagHeight: height = undefined,
        inline = false,
        fallbackFlag = undefined,
        fallbackName = undefined
    }: Props = $props();

    let label = $derived(attrs?.name ?? fallbackName ?? "");
</script>

{#if inline}
<div class="inline-flex items-center gap-1">
    <DelFlag {label} url={attrs?.flagURL} height={height ?? "h-4"} fallback={fallbackFlag ?? "none"} inline />
    <span class="text-left">{label}</span>
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{label}</h2>
    <DelFlag {label} url={attrs?.flagURL} height={height ?? "h-[25dvh]"} fallback={fallbackFlag ?? "un"} />
</div>
{/if}