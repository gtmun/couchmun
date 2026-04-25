<!--
    Set of dots that allow you to traverse through various pages.
    Similar to Zag.js's "Tabs" or "Steps".
-->
<script lang="ts">
    import { a11yLabel } from "$lib/util";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";

    interface Props {
        /** The total number of pages this paginator has. */
        totalPages: number,
        /** The current page index. */
        page: number,
        /**
         * An array or function which indicates which indicates which indices are disabled.
         * This means they will be visible, but not traversable
         * (unless forced by setting the page variable).
         */
        disabled?: boolean[] | ((i: number) => boolean),
        /**
         * An array or function which indicates which indicates which indices are hidden.
         * This means they will be invisible and not traversable
         * (unless forced by setting the page variable).
         */
        hidden?: boolean[] | ((i: number) => boolean),
    }
    let {
        totalPages,
        page = $bindable(),
        disabled = undefined,
        hidden = undefined
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
        for (let i = page + 1; i <= totalPages - 1; i++) {
            if (!getDisabled(i)) return i;
        }
    });
    export function incrementPage() {
        if (typeof nextPage === "number") {
            page = nextPage;
        }
    }

    function get(a: boolean[] | ((i: number) => boolean) | undefined, i: number) {
        return Array.isArray(a) ? a[i] : a?.(i);
    }
    function getDisabled(i: number) {
        return get(disabled, i) || get(hidden, i);
    }
    function getHidden(i: number) {
        return get(hidden, i);
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
    {#each Array.from({ length: totalPages }) as _, i}
        {@const pressed = page == i}
        {@const disabled = getDisabled(i)}
        {#if !getHidden(i)}
            <button
                class={[
                    "rounded-full size-3 transition",
                    pressed 
                        ? "preset-filled-primary-500 scale-150"
                        : "preset-filled-surface-300-700",
                    disabled && "cursor-not-allowed"
                ]}
                onclick={() => {if (!disabled) page = i}}
                {...a11yLabel(`Go to Page ${i}`)}
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