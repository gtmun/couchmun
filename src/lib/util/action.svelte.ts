import type { Action } from "svelte/action";

type EditableParameter = {
    when?: boolean,
    value?: string,
    allowEmpty?: boolean,
}
/**
 * Action to make an element editable (when `when` is true).
 * 
 * This applies the standard styling for editable elements as well as adds listeners on content update.
 * On content update, the `options.value` parameter is updated. This can be replaced with a get/set pair
 * to perform arbitrary update handlers.
 * 
 * To properly style an editable element, the element should also have the `contenteditable:editable-std` class.
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
            if (trimmed || options.allowEmpty) {
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
    
    $effect(() => {
        let editable = options?.when ?? true;
        el.contentEditable = editable ? "plaintext-only" : "inherit";
        setHandlers(editable);

        return () => setHandlers(false);
    });
}) satisfies Action<HTMLElement, EditableParameter>;