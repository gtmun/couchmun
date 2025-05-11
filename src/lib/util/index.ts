/**
 * Miscellaneous helper functions.
 */

import type { ModalSettings, ModalStore } from "@skeletonlabs/skeleton-svelte";
import { cubicOut } from "svelte/easing";
import type { Action } from "svelte/action";
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

/**
 * Clamps a value between a minimum and maximum. 
 * If the value is less than the minimum, this returns the minimum,
 * and if it is greater than the maximum, this erturns the maximum.
 * 
 * @param value the value
 * @param min the minimum
 * @param max the maximum
 * @returns the clamped value
 */
export function clamp(value: number, min: number, max: number) {
    if (Number.isNaN(value)) return max;
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

async function waitNextFrame() {
    return new Promise<number>(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
        });
    });
}

type EditableParameter = {
    when?: boolean,
    value?: string
}
/**
 * Action to make an element editable (when `when` is true).
 * 
 * This applies the standard styling for editable elements as well as adds listeners on content update.
 * On content update, the `options.value` parameter is updated. This can be replaced with a get/set pair
 * to perform arbitrary update handlers.
 */
export const makeEditable = ((el: HTMLElement, options?: EditableParameter) => {
    // Event handlers.
    // Editable element should exit when defocused or enter is pressed:
    function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Enter") {
            e.preventDefault();
            el.blur();
        }
    }
    function onFocusOut() {
        if (options) {
            const trimmed = el.textContent?.trim();
            if (trimmed) {
                options.value = trimmed;
            }
            el.textContent = options.value ?? "";
        }
    };
    function setHandlers(enabled: boolean) {
        if (enabled) {
            el.addEventListener("keydown", onKeyDown);
            el.addEventListener("focusout", onFocusOut);
        } else {
            el.removeEventListener("keydown", onKeyDown);
            el.removeEventListener("focusout", onFocusOut);
        }
    }

    // Set styling to editable styling:
    function setStyling(enabled: boolean) {
        const STANDARD_STYLES = ["border-b-4", "border-transparent", "hover:border-surface-500", "focus:border-surface-500", "rounded-sm"];
        const DELAYED_STYLES = ["transition-[border-color,font-size]"];
        if (enabled) {
            // Add editable styling
            el.classList.add(...STANDARD_STYLES);
            waitNextFrame().then(() => el.classList.add(...DELAYED_STYLES));
        } else {
            el.classList.remove(...STANDARD_STYLES, ...DELAYED_STYLES);
        }
    }

    // Init: Set styling + handlers if applicable:
    let editable = typeof options?.when === "undefined" || options.when;
    el.contentEditable = editable ? "plaintext-only" : "inherit";
    if (editable) {
        setStyling(true);
        setHandlers(true);
    }
    
    return {
        update(newOptions) {
            // On update, update options + update handlers/styling accordingly:
            options = newOptions;
            let newEditable = typeof options?.when === "undefined" || options.when;
            el.contentEditable = newEditable ? "plaintext-only" : "inherit";
            if (editable != newEditable) {
                editable = newEditable;
                setStyling(editable);
                setHandlers(editable);
            }
            
        },
        destroy() {
            setHandlers(false);
        },
    };
}) satisfies Action<HTMLElement, EditableParameter>;