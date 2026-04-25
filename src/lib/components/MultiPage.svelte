<!-- A page which has multiple steps, used for roll call voting procedure and introduction of resolutions. -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import { fly, slide } from "svelte/transition";
    
    import PaginatorDots from "$lib/components/controls/PaginatorDots.svelte";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";
    
    interface Props {
        /**
         * List of pages defined in this multipage.
        */
        pages: {
            /** The display name of the page. */
            name: string,
            /** 
             * Whether this page is disabled.
             * If set to true, this page is visible but cannot be accessed or traversed to
             * by the typical controls.
            */
            disabled?: boolean,
            /**
             * Whether this page is hidden.
             * If set to true, this page cannot be seen by the typical controls.
             */
            hidden?: boolean
        }[],
        /**
         * The current page index.
         * 
         * Though bindable, setting this value may allow disabled/hidden pages to be bypassed.
         */
        pageIndex?: number,
        /**
         * The main content. The page index is provided to this snippet,
         *     allowing you to configure different parameters for different pages.
         * The snippet itself should consist of {#if page == n}{/if} blocks.
         */
        children?: Snippet<[number]>,
        /**
         * The content for the top-right status bar.
         * The page index is provided to this snippet.
        */
        topTail?: Snippet<[number]>
    }
    let {
        pages,
        pageIndex: page = $bindable(0),
        children,
        topTail
    }: Props = $props();

    // Pagination:
    let totalPages = $derived(pages.length);
    let paginator = $state<PaginatorDots>();
    let pageIncreased = $state(true);

    // Animations
    const flyIn  = (e: Element) => fly(e, { x: pageIncreased ? "100%" : "-100%", y: 0, duration: 300 });
    const flyOut = (e: Element) => fly(e, { x: pageIncreased ? "-100%" : "100%", y: 0, duration: 300 });
</script>

<div class="flex flex-col h-full gap-3">
    <!-- Top bar -->
    <div class="grid grid-cols-3 items-center">
        <div class="flex">
            {#key page}
                <div class="text-nowrap overflow-hidden" transition:slide={{ axis: "x" }}>
                    {pages[page].name}
                </div>
            {/key}
        </div>
        <PaginatorDots
            {totalPages}
            bind:this={paginator}
            bind:page={() => page, np => {
                pageIncreased = Math.sign(np - page) >= 0;
                page = np;
            }}
            disabled={pages.map(p => p.disabled ?? false)}
            hidden={pages.map(p => p.hidden ?? false)}
        />
        <div class="flex justify-end items-center h-6">
            {@render topTail?.(page)}
        </div>
    </div>
    <hr class="hr" />
    <!-- Main content -->
    <div class="grow overflow-auto">
        <div class="relative h-full">
            {#key page}
            <div class="w-full h-full absolute" in:flyIn out:flyOut>
                {@render children?.(page)}
            </div>
            {/key}
        </div>
    </div>
    <hr class="hr" />
    <!-- Bottom buttons -->
    <div class="flex justify-between">
        <button 
            class="btn preset-filled-primary-500"
            disabled={page <= 0}
            onclick={() => paginator?.decrementPage()}
        >
            <MdiChevronLeft />
            Previous
        </button>
        <button 
            class="btn preset-filled-primary-500"
            disabled={page >= totalPages - 1}
            onclick={() => paginator?.incrementPage()}
        >
            Next
            <MdiChevronRight />
        </button>
    </div>
</div>