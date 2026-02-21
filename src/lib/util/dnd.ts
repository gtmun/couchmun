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

import type { DragDropEventHandlers } from "@dnd-kit/svelte";
import { createSortable as _createSortable, isSortable, type CreateSortableInput } from "@dnd-kit/svelte/sortable";

export function createSortable(input: CreateSortableInput) {
    return _createSortable({ feedback: "clone", ...input });
}

type OnMove = (oldIdx: number, newIdx: number) => void;
type DndEventHandler = DragDropEventHandlers["onDragMove" | "onDragEnd"] & {};
type DndEventHandlerParam = Pick<Parameters<DndEventHandler>[0], "operation">;
export function handleDrag(
    moveable: unknown[] | OnMove,
    options?: {
        delay?: number
    }
) {
    const _move: OnMove = typeof moveable === "function"
        ? moveable
        : (oldIdx, newIdx) => move(moveable, oldIdx, newIdx);
    const delay = options?.delay;
    const callback = delay
        ? (oldIdx: number, newIdx: number) => setTimeout(() => _move(oldIdx, newIdx), delay)
        : (oldIdx: number, newIdx: number) => _move(oldIdx, newIdx);
    
    // Actual event handler, which finds the indexes and performs the move on the indices.
    return (e: DndEventHandlerParam) => {
        const { source, canceled } = e.operation;
        if (!canceled && isSortable(source)) {
            const oldIdx = source.sortable.initialIndex;
            const newIdx = source.sortable.index;
            
            callback(oldIdx, newIdx);
        }
    };
}

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