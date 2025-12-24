<script lang="ts">
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";

    interface Props {
        totalPages: number,
        page: number,
        disabled?: boolean[] | ((i: number) => boolean)
    }
    let {
        totalPages,
        page = $bindable(),
        disabled = undefined
    }: Props = $props();

    const prevPage = $derived.by(() => {
        for (let i = page - 1; i >= 0; i--) {
            if (!getDisabled(i)) return i;
        }
    });
    const nextPage = $derived.by(() => {
        for (let i = page + 1; i <= totalPages - 1; i++) {
            if (!getDisabled(i)) return i;
        }
    });

    function getDisabled(i: number) {
        if (Array.isArray(disabled)) {
            return disabled[i];
        } else {
            return disabled?.(i);
        }
    }
</script>
<div class="flex gap-3 justify-center items-center">
    <button
        class="btn btn-sm preset-tonal"
        disabled={typeof prevPage === "undefined"}
        onclick={() => {if (typeof prevPage === "number") page = prevPage}}
    >
        <MdiChevronLeft />
    </button>
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each Array.from({ length: totalPages }) as _, i}
        {@const pressed = page == i}
        {@const disabled = getDisabled(i)}
        <button
            class={[
                "rounded-full size-3 transition",
                pressed 
                    ? "preset-filled-primary-500 scale-150"
                    : "preset-filled-surface-300-700",
                disabled && "cursor-not-allowed"
            ]}
            onclick={() => {if (!disabled) page = i}}
            aria-label="Go to Page {i}"
            title="Go to Page {i}"
            aria-pressed={pressed}
            {disabled}
        ></button>
    {/each}
    <button
        class="btn btn-sm preset-tonal"
        disabled={typeof nextPage === "undefined"}
        onclick={() => {if (typeof nextPage === "number") page = nextPage}}
    >
        <MdiChevronRight />
    </button>
</div>