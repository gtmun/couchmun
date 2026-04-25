<!-- A page which has multiple steps, used for roll call voting procedure and introduction of resolutions. -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import { fly, slide } from "svelte/transition";
    
    import PaginatorDots from "$lib/components/controls/PaginatorDots.svelte";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";
    
    interface Props {
        pages: {
            name: string,
            disabled?: boolean,
            hidden?: boolean
        }[],
        pageIndex?: number,
        children?: Snippet<[number]>,
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