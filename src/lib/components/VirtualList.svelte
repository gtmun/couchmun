<!--
  @component A virtual list.

  This component acts as a list which only loads the data visible in the viewport.
  This is useful for reducing loading times when a large array (e.g., delegate roll call)
  is mounted onto the page.
-->

<script lang="ts" generics="T">
    import { onMount, tick, type Snippet } from "svelte";
    import type { ClassValue } from "svelte/elements";

    import { watchEffect } from "$lib/util/sv.svelte";

    // Copyright (c) 2018 Rich Harris
    // Permission is hereby granted by the authors of this software, to any person, to use the software for any purpose, free of charge, including the rights to run, read, copy, change, distribute and sell it, and including usage rights to any patents the authors may hold on it, subject to the following conditions:
    // This license, or a link to its text, must be included with all copies of the software and any derivative works.
    // Any modification to the software submitted to the authors may be incorporated into the software under the terms of this license.
    // The software is provided "as is", without warranty of any kind, including but not limited to the warranties of title, fitness, merchantability and non-infringement. The authors have no obligation to provide support or updates for the software, and may not be held liable for any damages, claims or other liability arising from its use.
    // 
    // Derived from: https://github.com/sveltejs/svelte-virtual-list

    interface Props {
        /**
         * Items contained in the virtual list.
         */
        items: T[],

        /**
         * The height of the container as a Tailwind class (default "h-full").
         */
        height?: string,

        /**
         * The height of an item.
         * By default, this is computed from the size of the container.
         */
        itemHeight?: number,

        /**
         * The amount of pixels of invisible space above and below the viewport
         * which should also be used for rendering elements.
        */
        viewportBuffer?: number,
        /**
         * Row formatting.
         * 
         * This snippet provides a list of visible rows
         * (which each include the corresponding list item and index),
         * which can be used to display the row.
         * 
         * This snippet should likely start with an `{#each}` block displaying
         * each element.
         */
        rows: Snippet<[{
            data: T,
            index: number
        }[]]>,
        
        /**
         * Additional viewport classes.
         */
        viewportClasses?: ClassValue
    }
    let {
        items,
        height = "h-full",
        itemHeight = undefined,
        viewportBuffer = 0,
        rows,
        viewportClasses = ""
    }: Props = $props();

    // ~~~ Local state ~~~
    // First and last index currently displayed in viewport.
    let start = $state(0);
    let end = $state(0);
    // Heights of elements representing the items.
    let heightMap: number[] = [];
    /// The viewport.
    let viewport = $state<HTMLDivElement>();
    let viewportHeight = $state(0);
    /// The contents. This contains both the list of items as well as padding
    /// (defined by the "top" and "bottom" variables).
    let contents = $state<HTMLDivElement>();
    // Visible elements (based on start/end)
    let visible = $derived(
        items.slice(start, end).map((data, i) => ({ index: i + start, data }))
    );
    // Average height of the contents up until the bottom of the viewable portion.
    // This includes space above the viewable portion.
    let avgHeight = $state(0);
    /// How far from the beginning is the top of the viewable portion.
    let top = $state(0);
    /// How far from the end is the bottom of the viewable portion.
    let bottom = $derived((items.length - end) * avgHeight);
    
    onMount(() => resizeViewport());
    watchEffect(() => [items, viewportHeight, itemHeight], resizeViewport);

    function getOffsetHeight(row: Element): number {
        return row instanceof HTMLElement ? row.offsetHeight : 0;
    }
    /// Update padding values as various configuration elements get updated.
    async function resizeViewport() {
        if (!viewport || !contents) return;
        
        // If number of items change, just go back to top.
        if (heightMap.length != items.length) {
            heightMap.length = items.length;
            viewport.scrollTo(0, 0);
        }

        const { scrollTop } = viewport;
        await tick(); // wait until the DOM is up to date

        // Find the "end index", the last visible item:
        let contentHeight = top - scrollTop; // height of visible data
        let i = start;
        while (contentHeight < viewportHeight && i < items.length) {
            let row = contents.children[i - start];
            if (!row) { 
                // Predict number of rows needed to fill viewport space:
                let delta = 1;
                if (avgHeight != 0) {
                    delta = Math.max(delta, Math.floor(viewportHeight / avgHeight));
                }
                end = i + delta;
                await tick();
                
                row = contents.children[i - start];
            }

            // Update height for element
            heightMap[i] = itemHeight || getOffsetHeight(row);
            contentHeight += heightMap[i];
            i++;
            avgHeight = (scrollTop + contentHeight) / i;
        }
        end = i;
        avgHeight = (scrollTop + contentHeight) / end;
    }

    /// Update the state during scroll.
    async function handleScroll() {
        if (!viewport || !contents) return;
        
        const { scrollTop } = viewport;
        const oldStart = start;
        const rows = contents.children;
        // Update height map with rows' current heights
        for (let v = 0; v < rows.length; v++) {
            heightMap[start + v] = itemHeight || getOffsetHeight(rows[v]);
        }

        let i = 0;
        let y = 0;
        // Determine "top" (the amount of space in container before the beginning of the viewable area)
        for (; i < items.length; i++) {
            const rowHeight = heightMap[i] || avgHeight;
            if (y + rowHeight > scrollTop - viewportBuffer) {
                start = i;
                top = y;

                break;
            }

            y += rowHeight;
        }

        // Determine how many elements are in the viewport
        while (i < items.length) {
            y += heightMap[i] || avgHeight;
            i += 1;

            if (y > scrollTop + viewportHeight + viewportBuffer) break;
        }

        end = i;
        avgHeight = y / end;

        // Update remaining height
        heightMap.fill(avgHeight, i);

        // prevent jumping if we scrolled up into unknown territory
        if (start < oldStart) {
            await tick();

            let expectedHeight = 0;
            let actualHeight = 0;

            for (let i = start; i < oldStart; i += 1) {
                if (rows[i - start]) {
                    expectedHeight += heightMap[i];
                    actualHeight += itemHeight || getOffsetHeight(rows[i - start]);
                }
            }

            const d = actualHeight - expectedHeight;
            viewport.scrollTo(0, scrollTop + d);
        }
    }
</script>

<div
    class={["overflow-y-auto", height, viewportClasses]}
    bind:this={viewport}
    bind:offsetHeight={viewportHeight}
    onscroll={handleScroll}
>
    <div
        bind:this={contents}
        style="padding-top: {top}px; padding-bottom: {bottom}px;"
    >
        {@render rows(visible)}
    </div>
</div>
