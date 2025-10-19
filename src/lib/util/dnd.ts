/**
 * Utilities for managing svelte-dnd-action.
 * 
 * To implement drag-and-drop with svelte-dnd-action, the following steps should be performed:
 * 1. Make a stateful copy of the array you want to observe.
 * 2. Apply the `use:dndzone` or `use:dragHandleZone` onto the element that should be DnDable.
 *     a. Set the given events: 
 *         - `onconsider = (e) => copy = e.detail.items`, 
 *         - `onfinalize = (e) => original = copy = e.detail.items`
 * 3. Apply any styling to the shadow element and dragged element.
 * 
 * In full, that would look like the following:
 * ```svelte
 * <script lang="ts">
 *   // (1)
 *   let dndItems = $derived(originalItems);
 * 
 *   // ...
 * </script>
 * 
 * <!-- (2) -->
 * <div 
 *   use:dndzone={{
 *     items: dndItems,
 *     flipDurationMs: 150,
 *     dropTargetStyle: {}
 *   }}
 *   onconsider={(e) => dndItems = e.detail.items}
 *   onfinalize={(e) => originalItems = dndItems = e.detail.items}
 * >
 *   {#each dndItems as item (item.id)}
 *     {@const shadow = isDndShadow(item)}
 *     <!-- (3): Apply attributes, with `shadow` indicating shadow element -->
 *   {/each}
 * </div>
 * 
 * <!-- (3): Apply styling to dragged element (which should copy element's styling) -->
 * <style lang="postcss">
 *   :global(#dnd-action-dragged-el).dnd-list-item {
 *     @apply ...;
 *   }
 *   :global(.dark #dnd-action-dragged-el).dnd-list-item {
 *     @apply ...;
 *   }
 * </style>
 * ```
 */

import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from "svelte-dnd-action";

export type DndItem = {
    id: string,
    [SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
    originalId?: string
};

/**
 * Tests whether item is a shadow element
 * (i.e., the data representing this element is being dragged
 *    and currently has a placeholder in its original position)
 * @param item the item
 * @returns whether it is a shadow element
 */
export function isDndShadow(item: DndItem): boolean {
    return !!item[SHADOW_ITEM_MARKER_PROPERTY_NAME];
}

/**
 * Creates a display for a dragged `<tr>`.
 * @param el The TR element
 * @param origTable Reference to table that the `<tr>` originated from
 */
export function createDragTr(el?: HTMLElement, origTable?: HTMLTableElement) {
    if (!el) return;
    if (el.classList.contains("dragged-element")) return;
    if (!origTable) return;

    // Copies <tr>
    const tr = document.createElement(el.tagName);
    tr.replaceChildren(...Array.from(el.children, c => c.cloneNode(true)));

    // Copies <thead>, <tbody>, <table>
    const thead = origTable.querySelector("thead")!.cloneNode(true) as HTMLTableSectionElement;
    thead.id = "";
    thead.classList.add("collapse!");

    const tbody = origTable.querySelector("tbody")!.cloneNode() as HTMLTableSectionElement;
    tbody.id = "";
    tbody.replaceChildren(tr);

    const table = origTable.cloneNode() as HTMLTableElement;
    table.id = "";
    table.replaceChildren(thead, tbody);

    // Updates element to include table:
    el.classList.add("dragged-element");
    el.replaceChildren(table);
  }