/**
 * Utilities for managing drag-and-drop.
 * 
 * This module allows you to create a drag-and-droppable list from (most) layouts.
 * This works with the table and flex layouts, but not the grid layout.
 * 
 * To create this, first create a dndManager with `createDnd`:
 * ```
 * const dndManager = createDnd({
 *     onmove: (oldIdx, newIdx) => { ... }, // update some state during management
 *     onmoveend: (oldIdx, newIdx) => { ... }, // finalize updated state
 * });
 * ```
 * 
 * Then, you can mark an element as part of the list by placing {@attach dndManager.item(...)} on it.
 * You can also mark a subelement as a handle by placing {@attach dndManager.handle} on it.
 * 
 * You can also style the shadow by using data-dnd-placeholder:... 
 * or the moving element by using data-dragging:... as Tailwind classes.
 */

import { DragDropManager, type FeedbackType } from "@dnd-kit/dom";
import { isSortable, Sortable } from "@dnd-kit/dom/sortable";
import { onDestroy } from "svelte";
import type { Attachment } from "svelte/attachments";

/**
 * The interface provided by `createDnd`,
 * which is used to manage drag-and-droppable lists.
 */
interface DndInterface {
    /**
     * The actual underlying manager, from `@dnd-kit/dom`.
     */
    manager: DragDropManager,
    /**
     * Marks an element as draggable and droppable.
     * @param options The configuration for the item.
     * @returns An attachment, which can be bound using {@attach ...}
     */
    item: (options: {
        /**
         * An ID to identify this item. 
         * 
         * If using {#each}, this should match the key of the block.
         *  */
        id: string,
        /**
         * The index of the item in the list.
         */
        index: number
    }) => Attachment,
    handle: Attachment
}
type OnMove = (oldIdx: number, newIdx: number) => void;
/**
 * Creates a drag-and-droppable manager.
 */
export function createDnd(dndOptions: {
    /**
     * Handler called when a drag is occurring.
     * This is useful for updating intermediate/immediate state.
     */
    onmove?: OnMove,
    /**
     * Handler called when a drag completes.
     * This is useful for updating the actual state after a drag is complete.
     */
    onmoveend?: OnMove,
    /**
     * The feedback type of the draggable, which typically controls the display of the placeholder.
     * By default, this is "clone", but can be switched to "default" to hide the placeholder.
     * 
     * Refer to <https://next.dndkit.com/concepts/draggable#feedback> for more info.
     */
    feedback?: FeedbackType
}): DndInterface {
    const manager = new DragDropManager();
    manager.monitor.addEventListener("dragmove", e => {
        const { source, canceled } = e.operation;
        if (!canceled && isSortable(source)) {
            const oldIdx = source.sortable.initialIndex;
            const newIdx = source.sortable.index;
            
            if (oldIdx != newIdx) {
                dndOptions.onmove?.(oldIdx, newIdx);
            }
        }
    });
    manager.monitor.addEventListener("dragend", e => {
        const { source, canceled } = e.operation;
        if (!canceled && isSortable(source)) {
            const oldIdx = source.sortable.initialIndex;
            const newIdx = source.sortable.index;
            
            setTimeout(() => {
                dndOptions.onmoveend?.(oldIdx, newIdx);
            }, 300); // delay needed for anim to finish
        }
    });
    onDestroy(manager.destroy);

    return {
        manager,
        item: (options) => {
            const { id, index } = options;
            return element => {
                const handle = element.getElementsByClassName(DND_HANDLE_CLASS)?.[0];
                const sortable = new Sortable(
                    { id, index, element, handle, feedback: dndOptions.feedback ?? "clone" },
                    manager
                );
                return sortable.destroy;
            }
        },
        handle: element => {
            element.classList.add(DND_HANDLE_CLASS);
        }
    };
}
const DND_HANDLE_CLASS = "dnd-handle";

/**
 * Moves the element at `oldIdx` and places it at `newIdx`, mutating the array in place.
 * 
 * This assumes the indices are valid for the array.
 * @param arr the array to mutate
 * @param oldIdx the old index
 * @param newIdx the new index
 * @returns the array
 */
export function move<T>(arr: T[], oldIdx: number, newIdx: number) {
    arr.splice(newIdx, 0, ...arr.splice(oldIdx, 1));
    return arr;
}