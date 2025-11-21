/**
 * Utilities for creating and managing popups.
 * 
 * To create a popup, you want to use the `<Popover>` component,
 * define an open state, positioning, trigger classes (a button),
 * and use `POPUP_CARD_CLASSES` as the content base.
 * 
 * ```html
 * <Popover
 *     open={popupOpen}
 *     onOpenChange={e => popupOpen = e.open}
 *     positioning={{ placement: 'bottom' }}
 *     triggerBase="preset-filled-warning-500"
 *     triggerClasses="btn-icon-std"
 *     triggerAriaLabel="<label to supplement icon>"
 *     contentBase={POPUP_CARD_CLASSES}
 *     arrow
 * >
 *     {#snippet trigger()}
 *         <MdiIcon />
 *     {/snippet}
 *     {#snippet content()}
 *         ...
 *     {/snippet}
 * </Popover>
 * ```
 */

/**
 * Default Tailwind classes for popup cards.
 */
export const POPUP_CARD_CLASSES = "card-filled overflow-hidden p-4 z-1!";
