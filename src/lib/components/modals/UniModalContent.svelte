<script lang="ts" generics="T">
    import { Dialog } from "@skeletonlabs/skeleton-svelte";
    import { type Snippet } from "svelte";

    import MdiClose from "~icons/mdi/close";

    interface Props extends ContentProps<T> {
        exitState: ExitState<T>,
    }

    let {
        title = undefined,
        main = undefined,
        footer = undefined,
        exitState
    }: Props = $props();
</script>

<script module lang="ts">
    /**
     * Callbacks provided to allow for exiting.
     */
    export type ExitState<T> = {
        /**
         * Submits data to the modal trigger and closes the modal.
         */
        submit: (value: T) => void,
        /**
         * Closes the modal without submitting data to the modal trigger.
         */
        close: () => void
    };

    export type ContentProps<T> = {
        /**
         * The title at the top of the modal
         */
        title?: string | Snippet;
        /**
         * The inner content of the modal
         */
        main?: Snippet<[ExitState<T>]>;
        /**
         * The footer content of the modal
         */
        footer?: Snippet<[ExitState<T>]>;
    }
</script>

<header class="flex justify-between items-center">
    <Dialog.Title class="text-lg font-bold">
        {#if typeof title === "string"}
            {title}
        {:else}
            {@render title?.()}
        {/if}
    </Dialog.Title>
    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
        <MdiClose />
    </Dialog.CloseTrigger>
</header>
{@render main?.(exitState)}
<footer class="flex justify-end">
    {@render footer?.(exitState)}
</footer>