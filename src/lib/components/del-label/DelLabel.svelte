<!-- 
  @component A wrapper that displays a delegate's name and their flag.

  This handles accessibility and differences between inline/non-inline labels.
-->

<script lang="ts">
    import type { Snippet } from "svelte";

    import DelFlag, { SIZE_CLASSES_DISPLAY, SIZE_CLASSES_INLINE } from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";

    interface Props {
        /**
         * The attributes of the delegate
         * (this can be undefined to indicate no delegate).
         */
        attrs: DelegateAttrs | undefined;
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

        label?: Snippet<[string]>,
    }

    let {
        attrs,
        inline = false,
        fallbackFlag = undefined,
        fallbackName = undefined,
        label: labelSnippet
    }: Props = $props();

    let label = $derived(attrs?.name ?? fallbackName ?? "");
</script>

{#if inline}
<div class="inline-flex items-center gap-1">
    <div class={SIZE_CLASSES_INLINE}>
        <DelFlag {label} url={attrs?.flagURL} fallback={fallbackFlag ?? "none"} inline />
    </div>
    <span class="text-left">{label}</span>
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    {#if labelSnippet}
        {@render labelSnippet(label)}
    {:else}
        <h2 class="h2">{label}</h2>
    {/if}
    <div class={SIZE_CLASSES_DISPLAY}>
        <DelFlag {label} url={attrs?.flagURL} fallback={fallbackFlag ?? "un"} />
    </div>
</div>
{/if}