<script lang="ts">
    import type { SessionDatabase } from "$lib/db/index.svelte";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import type { SortOrder } from "$lib/types";
    import { a11yLabel } from "$lib/util";
    import MdiArrowDown from "~icons/mdi/arrow-down";
    import MdiCircleSmall from "~icons/mdi/circle-small";
    import MdiMerge from "~icons/mdi/merge";

    interface Props {
        /**
         * Database, which contains settings. Used to set sort order.
        */
        db: SessionDatabase,
        /**
         * Current state of sort order, used to display states.
         */
        sortOrder: SortOrder,
    }
    let { db, sortOrder }: Props = $props();

    // SORT ORDER
    function mergeUnmergeOrder(entryIndex: number, kindIndex: number) {
        if (entryIndex == 0 && kindIndex == 0) return;
        db.settings.update("sortOrder", ({ val: $o }) => {
            if (kindIndex == 0) {
                // Merge
                let [entry] = $o.splice(entryIndex, 1);
                if (entry) {
                    $o[entryIndex - 1].kind.push(...entry.kind);
                    // TODO: merge order
                }
            } else {
                // Unmerge
                let origKinds = $o[entryIndex].kind;
                let newKinds = origKinds.splice(kindIndex, origKinds.length - kindIndex);
                if (newKinds.length > 0) {
                    $o.splice(entryIndex + 1, 0, {
                        kind: newKinds,
                        order: $state.snapshot($o[entryIndex].order)
                    });
                }
            }
        });
    }
</script>

<h3 class="h3 text-center" id="sort-order">Sort Order (WIP)</h3>
<div class="flex gap-3">
    <!-- Sort Order Table -->
    <div class="table-wrap rounded border border-surface-200-800">
        <table class="table">
            <thead>
                <tr>
                    <th>Motion</th>
                    <th>Tiebreakers</th>
                </tr>
            </thead>
            <tbody>
                <!-- No key exists -->
                <!-- eslint-disable-next-line svelte/require-each-key -->
                {#each sortOrder as entry, ei}
                <tr>
                    <td>
                        <!-- No key exists -->
                        <!-- eslint-disable-next-line svelte/require-each-key -->
                        {#each entry.kind as k, ki}
                            <div class="flex items-center">
                                <button 
                                    class="btn-icon-std" 
                                    onclick={() => mergeUnmergeOrder(ei, ki)} 
                                    disabled={ei == 0 && ki == 0}
                                    {...a11yLabel("Merge With Above Cell")}
                                >
                                    {#if ki == 0}
                                        <MdiMerge />
                                    {:else}
                                        <MdiCircleSmall />
                                    {/if}
                                </button>
                                {SORT_KIND_NAMES[k]}
                            </div>
                        {/each}
                    </td>
                    <td>
                        <div class="flex gap-3 items-center">
                            <!-- No key exists -->
                            <!-- eslint-disable-next-line svelte/require-each-key -->
                            {#each entry.order as key, oi}
                            <div class="card-filled p-1 flex items-center">
                                <span>{SORT_PROPERTY_NAMES[key.property]}</span>
                                <button onclick={() => {
                                    db.settings.update("sortOrder", ({ val: order }) => { order[ei].order[oi].ascending = !order[ei].order[oi].ascending })
                                }}>
                                    <!-- TODO: add aria-label, title -->
                                    <MdiArrowDown
                                        class={["transition-transform", key.ascending && "rotating-180"]}
                                        width="1.2em"
                                        height="1.2em"
                                    />
                                </button>
                            </div>
                            {/each}
                        </div>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>