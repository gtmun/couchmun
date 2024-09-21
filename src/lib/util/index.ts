import type { ModalSettings, ModalStore } from "@skeletonlabs/skeleton";
import Sortable from "sortablejs";

/**
 * Utility for creating a confirmation modal.
 * @param modalStore The modal store (obtainable via `getModalStore()`)
 * @param body Text content for the modal
 * @param successCallback What should happen if the user presses "confirm" on this modal
 * @param errorCallback What should happen if the user presses "cancel" on this modal (optional)
 */
export function triggerConfirmModal(
    modalStore: ModalStore, 
    body: string, 
    successCallback: () => void, 
    errorCallback: () => void = () => {}
) {
    modalStore.trigger({
        type: "confirm",
        title: "Confirm",
        body,
        response(r: boolean) {
            return r ? successCallback() : errorCallback();
        }
    } satisfies ModalSettings);
}

/**
 * A `use` action that can be used to make an element's contents draggable.
 */
export function sortable(el: HTMLElement, options?: Sortable.Options) {
    // Technically you can use use:Sortable.create, but it causes issues 
    // because the destroy runs after the element is destroyed.
    Sortable.create(el, options);
}