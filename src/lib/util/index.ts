import type { ModalSettings, ModalStore } from "@skeletonlabs/skeleton";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

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
 * Variant of slide transition which lazily computes the style properties when needed.
 * 
 * The benefit of this is that it computes width/height *after* images load, 
 * meaning they will properly be accounted for in transition calculations.
 * 
 * This code is based on https://github.com/sveltejs/svelte/blob/1d773ef3a471adb36eb3c992168b21fbaf349562/packages/svelte/src/transition/index.js#L102C1-L136C2,
 * reducing it to only width/height and padding properties,
 * as well as implementing delayed style computation.
 */
export function lazyslide(node: HTMLElement, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
    let style: CSSStyleDeclaration | undefined = undefined;
    const dimProperty = axis === 'y' ? 'height' : 'width';
    const padProperty = axis === 'y' ? ['paddingTop', 'paddingBottom'] as const : ['paddingLeft', 'paddingRight'] as const;
    let dimValue: number | undefined = undefined;
    let padTLValue: number | undefined = undefined;
    let padBRValue: number | undefined = undefined;

    return {
        delay,
        duration,
        easing,
        css: (t) => {
            if (t > 0 && typeof dimValue === "undefined") {
                style = getComputedStyle(node);
                dimValue = parseFloat(style[dimProperty]);
                padTLValue = parseFloat(style[padProperty[0]]);
                padBRValue = parseFloat(style[padProperty[1]]);
            }

            return 'overflow: hidden; ' +
                `${dimProperty}: ${t * (dimValue ?? 0)}px;` +
                `${padProperty[0]}: ${t * (padTLValue ?? 0)}px;` +
                `${padProperty[1]}: ${t * (padBRValue ?? 0)}px;`;
        }
    } satisfies TransitionConfig;
}
