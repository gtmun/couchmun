<script lang="ts">
    import { createDroppable, DragDropProvider } from "@dnd-kit/svelte";
    import { isSortable } from "@dnd-kit/svelte/sortable";
    import { Popover, Portal } from "@skeletonlabs/skeleton-svelte";
    import { flip } from "svelte/animate";
    import { v7 as uuidv7 } from "uuid";

    import { DEFAULT_SORT_PRIORITY, getAllSortableKeys, getSortLabel } from "$lib/motions/definitions";
    import { SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import type { SortOrder } from "$lib/types";
    import { a11yLabel } from "$lib/util";
    import { createSortable, handleDrag, moveAcross } from "$lib/util/dnd";
    import { proxify } from "$lib/util/sv.svelte";
    import MdiArrowDown from "~icons/mdi/arrow-down";
    import MdiCallMerge from "~icons/mdi/call-merge";
    import MdiClose from "~icons/mdi/close";
    import MdiDragVertical from "~icons/mdi/drag-vertical";
    import MdiPlus from "~icons/mdi/plus";

    interface Props {
        /**
         * Current state of sort order, used to display states.
         */
        sortOrder: SortOrder,
    }
    let { sortOrder: initialSortOrder = $bindable() }: Props = $props();

    const COLUMN_KEY = "sort-entry";
    const KIND_KEY = "sort-kind";

    let sortOrder = $derived(installKeys_(initialSortOrder));
    let dndSortOrder = $derived(proxify(sortOrder));
    let tiebreakEditMode = $state(false);

    function updateSortOrder_(s: SortOrder) {
        // Validate tiebreakers:
        for (let e of s) {
            let acceptableKeys = getAllSortableKeys(...e.kind);
            e.order = e.order.filter(k => acceptableKeys.includes(k.property));
        }
        // Update db:
        initialSortOrder = uninstallKeys_(s);
    }
    function installKeys_(s: SortOrder) {
        return $state.snapshot(s).map(e => Object.assign(e, { id: uuidv7() }))
    }
    function uninstallKeys_(s: (SortOrder[number] & { id?: string })[]): SortOrder {
        return $state.snapshot(s.map(({ id: _, ...rest}) => rest));
    }

    function resetOrder() {
        updateSortOrder_($state.snapshot(DEFAULT_SORT_PRIORITY));
    }
    function addGroup() {
        sortOrder.push({
            kind: [],
            order: [],
            id: uuidv7()
        });
        updateSortOrder_(sortOrder);
    }
    function mergeUp(i: number) {
        if (i <= 0 || i >= sortOrder.length) return;
        const [ent] = sortOrder.splice(i, 1);
        
        const above = sortOrder[i - 1];
        above.kind.push(...ent.kind);
        // Resolve merge conflicts:
        // If the two sequences are equal, merge together.
        // If either is empty, pick the other.
        // If both are non-empty and non-equal, just destroy it.
        if (above.order.length != 0 && ent.order.length != 0) {
            const equal = above.order.length == ent.order.length && (
                above.order.every((o, i) => 
                    o.property == ent.order[i].property
                    && o.ascending == ent.order[i].ascending
                )
            );
            
            if (!equal) above.order = [];
        } else if (ent.order.length != 0) {
            above.order = ent.order;
        };

        updateSortOrder_(sortOrder);
    }
    function resync() {
        sortOrder = dndSortOrder;
        setTimeout(() => updateSortOrder_(sortOrder), 300);
    }
    function deleteFromGroup(entryIndex: number, orderIndex: number) {
        sortOrder[entryIndex].order.splice(orderIndex, 1);
        updateSortOrder_(sortOrder);
    }
    function addToGroup(entryIndex: number, property: string, ascending: boolean = false) {
        sortOrder[entryIndex].order.push({ property, ascending });
        updateSortOrder_(sortOrder);
    }

    function getSortPropertyName(p: string): string | undefined {
        return (SORT_PROPERTY_NAMES as Record<string, string>)[p];
    }
</script>

<h3 class="h3 text-center" id="sort-order">Sort Order</h3>
<div>
    <button class="btn preset-filled-primary-500" onclick={() => resetOrder()}>Reset</button>
    <button class="btn preset-filled-primary-500" onclick={() => addGroup()}>Add Group</button>
    <button
        class={["btn preset-filled-primary-500", tiebreakEditMode && "brightness-150 dark:brightness-50"]} onclick={() => tiebreakEditMode = !tiebreakEditMode}
        aria-pressed={tiebreakEditMode}
    >
        Add Tiebreaker
    </button>
</div>
<div class="flex gap-3">
    <!-- Sort Order Table -->
    <DragDropProvider
        onDragOver={e => {
            const { source, target } = e.operation;
            if (source?.type === KIND_KEY) {
                if (!isSortable(source)) return;
                
                // Get source array and index:
                let oldIdx = source.index;
                let oldGrp = dndSortOrder.find(e => (e.kind as unknown[]).includes(source.id))?.kind;
                if (typeof oldGrp === "undefined") return;

                // Find target array and index and apply move if present:
                if (isSortable(target)) {
                    let newGrp = dndSortOrder.find(e => (e.kind as unknown[]).includes(target.id))?.kind;
                    if (newGrp) moveAcross(oldGrp, oldIdx, newGrp, target.index);
                } else if (target) {
                    let newGrp = dndSortOrder.find(k => k.id === target.id)?.kind;
                    if (newGrp) moveAcross(oldGrp, oldIdx, newGrp, newGrp.length);
                }
            } else if (source?.type === COLUMN_KEY) {
                handleDrag(dndSortOrder)(e);
            }
        }}
        onDragEnd={resync}
    >
    <div class="table-wrap rounded border border-surface-200-800">
        <table class="table table-fixed">
            <thead>
                <tr>
                    <th class="w-[8%]"></th>
                    <th class="w-[6%]">#</th>
                    <th class="w-[30%]">Motion</th>
                    <th class="w-[46%]">Tiebreakers</th>
                    <th class="w-[8%]"></th>
                </tr>
            </thead>
            <tbody>
                {#each dndSortOrder as group, ei (group.id)}
                {const rowSort = createSortable({
                    get id() { return `r-${group.id}`; },
                    get index() { return ei; }, 
                    type: COLUMN_KEY,
                    accept: [COLUMN_KEY]
                })}
                {const groupDrop = createDroppable({
                    get id() { return group.id },
                    accept: [KIND_KEY],
                    collisionPriority: 1
                })}
                <tr
                    class={[
                        "bg-surface-50-950",
                        "data-dnd-dragging:rounded data-dnd-dragging:border!",
                        "data-dnd-placeholder:rounded data-dnd-placeholder:*:invisible data-dnd-placeholder:bg-surface-200-800",
                    ]}
                    {@attach rowSort.attach}
                >
                    <td>
                        <div {@attach rowSort.attachHandle}>
                            <MdiDragVertical />
                        </div>
                    </td>
                    <td>{ei + 1}</td>
                    <td class="py-3!" {@attach groupDrop.attach}>
                        <div class="flex flex-col gap-1">
                            {#each group.kind as kind, ki (kind)}
                                {const kindChip = createSortable({
                                    get id() { return kind; },
                                    get index() { return ki; },
                                    type: KIND_KEY,
                                    group: group.id,
                                    collisionPriority: 2,
                                    accept: [KIND_KEY]
                                }, "default")}
                                <div 
                                    class={[
                                        "chip preset-filled-surface-100-900 p-1 flex items-center select-none",
                                    ]} 
                                    {@attach kindChip.attach}
                                    animate:flip={{ duration: 150 }}
                                >
                                    {getSortLabel(kind)}
                                </div>
                            {/each}
                        </div>
                    </td>
                    <DragDropProvider
                        onDragOver={handleDrag(group.order)}
                        onDragEnd={resync}
                    >
                    <td>
                        <div class="flex flex-wrap gap-3 items-center">
                            {#each group.order as key, oi (key.property)}
                            {const keySort = createSortable({
                                get id() { return key.property },
                                get index() { return oi; }
                            }, "default")}
                            {@const keyName = getSortPropertyName(key.property)}
                            {@const ascDesc = key.ascending ? "Ascending" : "Descending"}
                            {@const ascDescRev = !key.ascending ? "Ascending" : "Descending"}
                            <div
                                class={["chip preset-filled-surface-100-900 p-1 flex items-center select-none", tiebreakEditMode && "cursor-default"]}
                                {@attach !tiebreakEditMode && keySort.attach}
                                {...(keyName ? a11yLabel(`${keyName} ${ascDesc}`) : {})}
                            >
                                <span>{keyName?.toLowerCase()}</span>
                                {#if tiebreakEditMode}
                                    <!-- Click to delete -->
                                    <button onclick={() => deleteFromGroup(ei, oi)}>
                                        <MdiClose
                                            width="1.2em"
                                            height="1.2em"
                                        />
                                    </button>
                                {:else}
                                    <!-- Click to swap asc/desc -->
                                    <button
                                        onclick={() => key.ascending = !key.ascending}
                                        {...a11yLabel(`Set ${ascDescRev}`)}
                                    >
                                        <MdiArrowDown
                                            class={["transition-transform", key.ascending && "rotate-180"]}
                                            width="1.2em"
                                            height="1.2em"
                                        />
                                    </button>
                                {/if}
                            </div>
                            {/each}
                            {#if tiebreakEditMode}
                            {@const addableKeys = getAllSortableKeys(...group.kind).filter(k => !group.order.find(({ property }) => property == k))}
                            <Popover>
                                <Popover.Trigger
                                    disabled={addableKeys.length == 0}
                                    {...a11yLabel("Add Tiebreaker")}
                                >
                                    <MdiPlus />
                                </Popover.Trigger>
                                <Portal>
                                    <Popover.Positioner>
                                        <Popover.Content class="card w-96 p-4 bg-surface-100-900 shadow-xl">
                                            <div class="flex flex-col gap-1">
                                                {#each addableKeys as k (k)}
                                                    <button class="btn preset-tonal-surface" onclick={() => addToGroup(ei, k)}>
                                                        {getSortPropertyName(k)}
                                                    </button>
                                                {/each}
                                            </div>
                                            <Popover.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-100-900)]">
                                                <Popover.ArrowTip />
                                            </Popover.Arrow>
                                        </Popover.Content>
                                    </Popover.Positioner>
                                </Portal>
                            </Popover>
                            {/if}
                        </div>
                    </td>
                    <td>
                        {#if ei != 0}
                            <button class="btn-icon btn-icon-xl" onclick={() => mergeUp(ei)}>
                                <MdiCallMerge />
                            </button>
                        {/if}
                    </td>
                    </DragDropProvider>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    </DragDropProvider>
</div>