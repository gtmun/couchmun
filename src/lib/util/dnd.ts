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

import { Feedback, type FeedbackType } from "@dnd-kit/dom";
import type { DragDropEventHandlers } from "@dnd-kit/svelte";
import { createSortable as createSortable_, isSortable, type CreateSortableInput } from "@dnd-kit/svelte/sortable";

/** Alias for `createSortable` from `@dnd-kit/svelte/sortable`, but with support for feedback. */
export function createSortable(input: CreateSortableInput, feedback: FeedbackType = "clone") {
    return createSortable_(Object.assign(input, {
        plugins: defaults => [...defaults, Feedback.configure({ feedback })]
    } satisfies Partial<CreateSortableInput>))
}

type OnMove = (oldIdx: number, newIdx: number) => void;
type DndEventHandler = DragDropEventHandlers["onDragMove" | "onDragEnd"] & {};
type DndEventHandlerParam = Pick<Parameters<DndEventHandler>[0], "operation">;

/**
 * Handles a drag event from `dnd-kit` between a sortable source and target.
 * 
 * This can be used to maintain Svelte state.
 * On the `DragDropProvider`, the most basic state-maintaining operation is the following:
 * 
 * ```svelte
 * <DragDropProvider
 *     onDragOver={handleDrag(dndItems)}
 *     onDragEnd={() => order = dndItems}
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
 * @returns An event handler.
 */
export function handleDrag(moveable: unknown[] | OnMove) {
    const move_: OnMove = typeof moveable === "function"
        ? moveable
        : (oldIdx, newIdx) => move(moveable, oldIdx, newIdx);
    
    // Actual event handler, which finds the indexes and performs the move on the indices.
    return (e: DndEventHandlerParam) => {
        const { source, target, canceled } = e.operation;
        if (!canceled && isSortable(source) && isSortable(target)) {
            move_(source.index, target.index);
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