<!--
  @component A basic modal wrapper. All modals in this folder likely should build on this component.

  This wrapper creates a card layout which spans across the screen.
  It also provides "close" and "submit" methods, which can be used to exit the modal.
-->
<script lang="ts" generics="T">
    import { type Snippet } from "svelte";

    interface Props extends ExitProps<T> {
        /**
         * The title at the top of the modal
         */
        title: string;
        /**
         * The inner content of the modal
         */
        main?: Snippet<[ExitState<T>]>;
        /**
         * The footer content of the modal
         */
        footer?: Snippet<[ExitState<T>]>;
    }

    let {
        title,
        open = $bindable(),
        onSubmit,
        main = undefined,
        footer = undefined
    }: Props = $props();

    function submit(value: T) {
        onSubmit(value);
        close();
    }
    function close() {
        open = false;
    }
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

    /**
     * If a given component uses the default exit handlers,
     * they must define these props and pass them to `<ModalContent />`.
     */
    export type ExitProps<T> = {
        /**
         * Modal's open state.
         */
        open: boolean;

        /**
         * Event to perform when submitting modal data.
         */
        onSubmit: ExitState<T>["submit"];
    }

    /**
     * Default classes for dialog modals.
     */
    export const defaultModalClasses = {
        contentBase: "card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm",
        backdropClasses: "backdrop-blur-sm",
    };
</script>

<div class="flex flex-col gap-3">
    <header class="flex">
        <h3 class="h3">{title}</h3>
    </header>
    <article class="flex">
        {@render main?.({ submit, close })}
    </article>
    <footer class="flex justify-end">
        {@render footer?.({ submit, close })}
    </footer>
</div>
