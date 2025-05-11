/**
 * Utilities for creating and managing popups.
 * 
 * The basic setup is the following:
 * - On the element you need to trigger the popup on, you attach the `use:popup={interactivePopup(POPUP_TARGET)}` action.
 * - To create the popup, create a popup `<div>`, like so:
 * ```html
 * <div class="{POPUP_CARD_CLASSES}" data-popup={POPUP_TARGET}>
 *     <!-- contents -->
 * </div>
 * ```
 * 
 * For additional details on autocomplete popups, see `DelAutocomplete.svelte`.
 */

import type { PopupSettings } from "@skeletonlabs/skeleton-svelte";

/**
 * Default Tailwind classes for popup cards.
 */
export const POPUP_CARD_CLASSES = "card overflow-hidden p-4 preset-filled-surface-100-900";

/**
 * Defaults for a popup which holds an autocomplete module.
 * @param target popup ID
 * @returns the settings
 */
export function autocompletePopup(target: string): PopupSettings {
    return {
        event: 'focus-click',
        target,
        placement: 'bottom',
        middleware: {
            size: {
                apply({availableHeight, elements}: any) {
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight}px`,
                    });
                },
            }
        }
    };
}
