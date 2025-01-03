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
 * Creates a new object where Maps each entry in the object to a new entry.
 * @param o the object
 * @param cb the callback
 * @returns the new object
 */
export function mapObj<
    K extends keyof unknown, V, 
    K1 extends keyof unknown, V1
>(o: Record<K, V>, cb: (key: K, val: V, i: number) => [K1, V1]): Record<K1, V1> {
    return Object.fromEntries(
        Object.entries<V>(o)
            .map(([k, v], i) => cb(k as K, v, i)
        )
    );
}

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