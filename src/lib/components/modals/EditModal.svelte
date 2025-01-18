<!--
  @component A basic modal wrapper. All modals in this folder likely should build on this component.

  This wrapper creates a card layout which spans across the screen.
  It also provides "close" and "submit" methods, which can be used to exit the modal.
-->
<script lang="ts">
    import { getModalStore } from "@skeletonlabs/skeleton";
    import { type Snippet } from "svelte";

    interface Props {
        /**
         * The title at the top of the modal
         */
        title: string;
        /**
         * The inner content of the modal
         */
        children: Snippet<[{
            /**
             * Submits data to the modal trigger and closes the modal.
             */
            submit: typeof submit,
            /**
             * Closes the modal without submitting data to the modal trigger.
             */
            close: typeof close
        }]>;
    }

    let { title, children }: Props = $props();

    const modalStore = getModalStore();

    function submit(value: any) {
        $modalStore[0].response?.(value);
        close();
    }
    function close() {
        modalStore.close();
    }
</script>

<div class="card p-4 w-2/3 md:w-1/2">
    <h2 class="h2 p-4">{title}</h2>
    {@render children({ submit, close })}
</div>