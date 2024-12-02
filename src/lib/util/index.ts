import type { DelegateAttrs, DelegatePresence } from "$lib/types";
import type { ModalSettings, ModalStore } from "@skeletonlabs/skeleton";

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

export type Comparator<K> = (a: K, b: K) => number;

/**
 * Compares two numbers by their `<`, `>` ordering.
 */
export const compare = ((a: any, b: any, reverse: boolean = false) => (reverse ? -1 : 1) * (a < b ? -1 : a > b ? 1 : 0)) satisfies Comparator<any>;

/**
 * Allows user to download a file.
 * @param filename The name of the file to download
 * @param contents The string in the file
 * @param type The type of the file (e.g., "application/json")
 */
export function downloadFile(filename: string, contents: string, type: string) {
    // Creates file to download:
    const a = document.createElement("a");
    const blob = new Blob([contents], { type });
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);

    // Downloads:
    a.click();

    // Teardown:
    setTimeout(() => {
        URL.revokeObjectURL(href);
        document.body.removeChild(a);
    }, 0);
}

/**
 * Checks a delegate presence status is present.
 * @param p the presence status
 * @returns whether it indicates presence
 */
export function isPresent(p: DelegatePresence): boolean {
    return p !== "NP";
}

/**
 * Checks if name is associated with a given delegate.
 * @param name name we're looking at
 * @param attr delegate we're looking at
 * @returns whether this delegate could correctly be referred to by the given name
 */
export function nameEq(name: string, attr: DelegateAttrs) {
    const eq = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) == 0;
    return [attr.name, ...attr.aliases].some(n => eq(n, name));
}