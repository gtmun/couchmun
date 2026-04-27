<!--
    Set of dots that allow you to traverse through various pages.
    Similar to Zag.js's "Tabs" or "Steps".
-->
<script lang="ts">
    import { a11yLabel } from "$lib/util";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";

    export type DotPage = {
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
    };

    interface Props {
        /** The current page index. */
        page: number,
        /** Set of pages available to paginator dots */
        pages: DotPage[],
    }
    let {
        page = $bindable(),
        pages,
    }: Props = $props();

    const prevPage = $derived.by(() => {
        for (let i = page - 1; i >= 0; i--) {
            if (!getDisabled(i)) return i;
        }
    });
    export function decrementPage() {
        if (typeof prevPage === "number") {
            page = prevPage;
        }
    }

    const nextPage = $derived.by(() => {
        for (let i = page + 1; i <= pages.length - 1; i++) {
            if (!getDisabled(i)) return i;
        }
    });
    export function incrementPage() {
        if (typeof nextPage === "number") {
            page = nextPage;
        }
    }

    function getDisabled(i: number) {
        return pages[i].disabled || pages[i].hidden;
    }
</script>
<div class="flex gap-3 justify-center items-center">
    <button
        class="btn btn-sm preset-tonal"
        disabled={typeof prevPage === "undefined"}
        onclick={() => decrementPage()}
    >
        <MdiChevronLeft />
    </button>
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each pages as { name: pageName, hidden }, i}
        {@const pressed = page == i}
        {@const disabled = getDisabled(i)}
        {#if !hidden}
            <button
                class={[
                    "rounded-full size-3 transition",
                    pressed 
                        ? "preset-filled-primary-500 scale-150"
                        : "preset-filled-surface-300-700",
                    disabled && "cursor-not-allowed"
                ]}
                onclick={() => {if (!disabled) page = i}}
                {...a11yLabel(`Go to ${pageName}`)}
                aria-pressed={pressed}
                {disabled}
            ></button>
        {/if}
    {/each}
    <button
        class="btn btn-sm preset-tonal"
        disabled={typeof nextPage === "undefined"}
        onclick={() => incrementPage()}
    >
        <MdiChevronRight />
    </button>
</div>