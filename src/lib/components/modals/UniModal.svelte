<!--
  @component A basic modal wrapper. All modals in this folder likely should build on this component.

  This wrapper creates a card layout which spans across the screen.
  It also provides "close" and "submit" methods, which can be used to exit the modal.
-->
<script lang="ts" generics="T">
    import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
    import { type Snippet } from "svelte";
    import type { ClassValue } from "svelte/elements";

    import UniModalContent, { type ContentProps, type ExitState } from "./UniModalContent.svelte";

    interface Props extends ContentProps<T> {
        /**
         * Modal's open state.
         */
        open: boolean;

        /**
         * Event to perform when submitting modal data.
         */
        onSubmit?: ExitState<T>["submit"];

        /**
         * Class which represents the backdrop color.
         */
        backdropColor?: ClassValue;

        /**
         * The type of dialog 
         * (either a drawer from the left or right OR a central modal).
         */
        type?: "drawerLeft" | "drawerRight" | "modal";

        /**
         * Trigger. This should be wrapped in a <Dialog.Trigger /> element.
         */
        trigger?: Snippet<[]>;

        /**
         * Override the entire content of the dialog.
         * If this is set, then `title`, `main`, `footer` have no effect.
         */
        content?: Snippet<[ExitState<T>]>;
    }

    let {
        title,
        open = $bindable(),
        onSubmit,
        trigger,
        content,
        main,
        footer,
        backdropColor = modalCls.backdrop.color,
        type = "modal",
    }: Props = $props();

    function submit(value: T) {
        onSubmit?.(value);
        close();
    }
    function close() {
        open = false;
    }

    let positionerCls: ClassValue = $derived([
        modalCls.positioner.base,
        type === "modal" ? modalCls.positioner.modal : modalCls.positioner.drawer
    ]);
    let cardCls: ClassValue = $derived([
        modalCls.card.base,
        modalCls.card.anim,
        ...(
              type === "modal" ? [modalCls.card.modal.size, modalCls.card.modal.anim]
            : type === "drawerLeft" ? [modalCls.card.drawer.size, modalCls.card.drawer.left]
            : type === "drawerRight" ? [modalCls.card.drawer.size, modalCls.card.drawer.right]
            : type satisfies never
        )
    ]);
</script>

<script module lang="ts">
    /**
     * Default classes for dialog modals.
     */
    export const modalCls = {
        backdrop: {
            base: "fixed inset-0 z-50",
            color: "bg-surface-500/50",
            anim: "transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100",
        },
        positioner: {
            base: "fixed inset-0 z-50",
            drawer: "flex justify-start",
            modal: "flex justify-center items-center p-4",
        },
        card: {
            base: "card bg-surface-50-950 p-4 space-y-4 shadow-xl",
            anim: "transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100",
            drawer: {
                size: "h-screen w-md",
                left: "-translate-x-full starting:data-[state=open]:-translate-x-full data-[state=open]:translate-x-0 rounded-l-none",
                right: "translate-x-[100vw] starting:data-[state=open]:translate-x-[100vw] data-[state=open]:translate-x-[calc(100vw_-_100%)] rounded-r-none"
            },
            modal: {
                size: "w-full max-w-xl",
                anim: "translate-y-[100px] starting:data-[state=open]:translate-y-[100px] data-[state=open]:translate-y-0"
            }
        }
    }
</script>

<Dialog {open} onOpenChange={e => open = e.open}>
    {@render trigger?.()}
    <Portal>
        <Dialog.Backdrop class={[modalCls.backdrop.base, backdropColor, modalCls.backdrop.anim]} />
        <Dialog.Positioner class={positionerCls}>
            <Dialog.Content class={cardCls}>
                {#if content}
                    {@render content({ submit, close })}
                {:else}
                    <UniModalContent {title} {main} {footer} exitState={{ submit, close }} />
                {/if}
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>