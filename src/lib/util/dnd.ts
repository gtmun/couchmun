/**
 * Utilities for managing drag-and-drop.
 * 
 * This module allows you to create a drag-and-droppable list from (most) layouts.
 * 
 * To create this, wrap a `<DragDropProvider />` around a list of elements.
 * 
 * Then, use the `handleDrag` method defined in this method.
 * 
 * You can also style the shadow by using data-dnd-placeholder:... 
 * or the moving element by using data-dnd-dragging:... as Tailwind classes.
 */

import type { DragDropEventHandlers } from "@dnd-kit/svelte";
import { createSortable as _createSortable, isSortable, type CreateSortableInput } from "@dnd-kit/svelte/sortable";

export function createSortable(input: CreateSortableInput) {
    return _createSortable({ feedback: "clone", ...input });
}

type OnMove = (oldIdx: number, newIdx: number) => void;
type DndEventHandler = DragDropEventHandlers["onDragMove" | "onDragEnd"] & {};
type DndEventHandlerParam = Pick<Parameters<DndEventHandler>[0], "operation">;

/**
 * Handles a drag event from `dnd-kit`.
 * 
 * This can be used to maintain Svelte state.
 * On the `DragDropProvider`, the most basic state-maintaining operation is the following:
 * 
 * ```svelte
 * <DragDropProvider
 *     onDragMove={handleDrag(dndItems)}
 *     onDragEnd={handleDrag(
 *         (oldIdx, newIdx) => order = move(dndItems, oldIdx, newIdx),
 *         { delay: 300 }
 *     )}
 * >
 *     ...
 * </DragDropProvider>
 * ```
 * 
 * @param moveable Item to move.
 * 
 * This can either be an array (in which the move will be applied),
 * or a function to apply the move.
 * 
 * @param options Additional options.
 *     `delay`: Delays the move (which is needed to cause a move to occur after drag end's transition)
 * 
 * @returns An event handler.
 */
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