<!-- @component A collapsible component, which collapses right to left if longer than wider,
    and collapses bottom to top if wider than longer.
-->
<script lang="ts">
    import { Collapsible } from "@skeletonlabs/skeleton-svelte";
    import type { Snippet } from "svelte";
    import { slide } from "svelte/transition";
    
    import MdiChevronLeft from "~icons/mdi/chevron-left";

    interface Props {
        /** Whether the collapsible is open (bindable). */
        open?: boolean,
        /**
         * The uncollapsed content.
         * 
         * This also decides the width/height of the collapsible,
         * so it should be set accordingly to the ratio of
         * uncollapsed content to everything else on the page.
         **/
        children: Snippet<[]>
    }

    let { open = $bindable(true), children }: Props = $props();

    let collapsibleEl = $state<HTMLDivElement>();
    let collapsibleHoriz = $state(getCHoriz());
    function getCHoriz() {
        return collapsibleEl ? getComputedStyle(collapsibleEl).flexDirection == "row" : true;
    }
</script>
<Collapsible
    class="flex-col md:flex-row items-stretch gap-0"
    {open}
    onOpenChange={e => open = e.open}
>
    {#snippet element(attributes)}
        <div {...attributes} bind:this={collapsibleEl}>
            <Collapsible.Content class="grow">
            {#snippet element(attributes)}
                {#if !attributes.hidden}
                <div
                    {...attributes}
                    class="overflow-hidden"
                    transition:slide={{ duration: 150, axis: collapsibleHoriz ? "x" : "y" }}
                >
                    {@render children()}
                </div>
                {/if}
            {/snippet}
            </Collapsible.Content>
            <div class="flex items-center justify-center">
                <Collapsible.Trigger class="btn-icon-std p-0 m-1 hover:preset-tonal">
                    <MdiChevronLeft
                    class={[
                        "transition-transform duration-150",
                        open ? "rotate-90 md:rotate-0" : "rotate-270 md:rotate-180"
                    ]}
                    />
                </Collapsible.Trigger>
            </div>
        </div>
    {/snippet}
</Collapsible>

<!-- HACK: Get orientation of collapsible in JS -->
<svelte:window onresize={() => collapsibleHoriz = getCHoriz()}></svelte:window>