import { SHADOW_ITEM_MARKER_PROPERTY_NAME, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from "svelte-dnd-action";

export type DndItem = {
    id: string,
    [SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
    originalId?: string
};

/**
 * Processes a DndEvent, creating a new array which the data array can be set to.
 * 
 * Typically, `order = e.detail.items` would be done to update state.
 * However, this can cause problems as ID is corrupted and original ID data can be lost.
 * 
 * Thus, this function does processing to preserve that data.
 * 
 * @param e The event
 * @returns The updated array
 */
export function processDrag<E extends DndItem>(e: CustomEvent<DndEvent<E>>): E[] {
    let placeholder = e.detail.items.find(s => s.id === SHADOW_PLACEHOLDER_ITEM_ID);
    if (placeholder) {
        placeholder.originalId = e.detail.info.id;
    }

    return e.detail.items;
}

/**
 * Tests whether item is a shadow element
 * (i.e., is being dragged and needs a placeholder in DOM).
 * @param item the item
 * @returns whether it is a shadow element
 */
export function isDndShadow(item: DndItem): boolean {
    let it: {
        [SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
    } = item;
    return !!it[SHADOW_ITEM_MARKER_PROPERTY_NAME];
}

/**
 * Gets the true ID of a drag-and-drop item.
 * @param item The item
 * @returns The ID
 */
export function getDndItemId(item: DndItem): string {
    let id = item.id;
    if (id == SHADOW_PLACEHOLDER_ITEM_ID) {
        id = item.originalId || id;
    }
    return id;
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
    let tr = document.createElement(el.tagName);
    tr.replaceChildren(...Array.from(el.children, c => c.cloneNode(true)));

    // Copies <thead>, <tbody>, <table>
    let thead = origTable.querySelector("thead")!.cloneNode(true) as HTMLTableSectionElement;
    thead.id = "";
    thead.classList.add("!collapse");

    let tbody = origTable.querySelector("tbody")!.cloneNode() as HTMLTableSectionElement;
    tbody.id = "";
    tbody.replaceChildren(tr);

    let table = origTable.cloneNode() as HTMLTableElement;
    table.id = "";
    table.replaceChildren(thead, tbody);

    // Updates element to include table:
    el.classList.add("dragged-element");
    el.replaceChildren(table);
  }