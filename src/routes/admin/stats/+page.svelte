<script lang="ts">
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { db, type Delegate } from "$lib/db";
    import { defaultStats, enabledDelegatesStore } from "$lib/db/del";
    import { getSessionDataContext } from "$lib/stores/session";
    import type { StatsData } from "$lib/types";
    import { compare, downloadFile, isPresent, triggerConfirmModal } from "$lib/util";
    import { stringifyTime } from "$lib/util/time";
    
    import Icon from "@iconify/svelte";
    import { ProgressBar, type PopupSettings, getModalStore, popup } from "@skeletonlabs/skeleton";

    const { settings: { title } } = getSessionDataContext();
    const delegates = enabledDelegatesStore(db.delegates);
    const modalStore = getModalStore();

    let sortOrder: { item: SortKey, descending: boolean } = $state({
        item: "durationSpoken",
        descending: true
    });
    type SortKey = keyof StatsData | "delegate";
    const COLUMNS = {
        delegate: { label: "Delegate" },
        motionsProposed: { label: "Motions Proposed" },
        motionsAccepted: { label: "Motions Accepted" },
        timesSpoken: { label: "Times Spoken" },
        durationSpoken: { label: "Duration Spoken" },
    } satisfies Record<SortKey, unknown>;

    function readEntryValue(entry: Delegate, key: SortKey) {
        if (key === "delegate") return entry.name;
        return entry.stats[key];
    }
    function isSortKey(k: string): k is SortKey {
        return k in COLUMNS;
    }
    function setSort(item: string) {
        if (!isSortKey(item)) return;

        if (sortOrder.item === item) {
            sortOrder.descending = !sortOrder.descending;
        } else {
            sortOrder = { item, descending: true };
        }
    }

    let maxDurationSpoken = $derived(Math.max(0, ...$delegates.map(({ stats }) => stats.durationSpoken)));
    let displayEntries = $derived(
        Array.from($delegates)
            .sort((e1, e2) => {
                let { item, descending } = sortOrder;
                return compare(readEntryValue(e1, item), readEntryValue(e2, item), descending);
            })
    );

    // Configuration
    const CONFIGURE_MODAL_SETTINGS: PopupSettings = {
        event: "click",
        target: "stats-button",
        closeQuery: ''
    }
    function exportStats() {
        let data = {
            committee: $title,
            delegates: $delegates
        };
        downloadFile("couchmun-del-stats.json", JSON.stringify(data), "application/json");
    }
    function clearStats() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to clear delegate statistics?",
            () => db.transaction("rw", db.delegates, () => {
                db.delegates.toCollection().modify({ stats: defaultStats() });
            })
        )
    }
</script>

<MetaTags title="Stats Screen &middot; CouchMUN (Admin)" />

<div class="flex flex-col gap-1">
    <div class="flex justify-end">
        <button 
            class="btn-icon variant-filled-warning"
            aria-label="Edit Stats"
            title="Edit Stats"
            use:popup={CONFIGURE_MODAL_SETTINGS}
        >
            <Icon icon="mdi:auto-fix" width="24" height="24" />
        </button>
    </div>
    <div class="table-container">
        <table class="table table-compact">
            <thead>
                <tr>
                    {#each Object.entries(COLUMNS) as [key, col]}
                    <th>
                        <button onclick={() => setSort(key)}>
                            {#if sortOrder.item === key}
                            <div class="flex items-center gap-1" aria-sort={sortOrder.descending ? "descending" : "ascending"}>
                                {col.label}
                                <Icon
                                    icon="mdi:arrow-up"
                                    class="{sortOrder.descending ? 'rotate-180' : ''} transition-[transform]"
                                    width="24"
                                    height="24"
                                />
                            </div>
                            {:else}
                            {col.label}
                            {/if}
                        </button>
                    </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each displayEntries as attrs (attrs.id)}
                {@const absent = !isPresent(attrs.presence)}
                <tr class:!bg-surface-300-600-token={absent}>
                    <td class="!align-middle">
                        {#if absent}
                        <div class="flex gap-1">
                            <span class="line-through italic">
                                <DelLabel {attrs} inline />
                            </span>
                            <span class="text-error-500-400-token">
                                (Absent)
                            </span>
                        </div>
                        {:else}
                        <DelLabel {attrs} inline />
                        {/if}
                    </td>
                    <td class="!align-middle">{attrs.stats.motionsProposed}</td>
                    <td class="!align-middle">{attrs.stats.motionsAccepted}</td>
                    <td class="!align-middle">{attrs.stats.timesSpoken}</td>
                    <td class="!align-middle">
                        <div class="flex items-center justify-end gap-3">
                            {stringifyTime(attrs.stats.durationSpoken / 1000, "round")}
                            <div class="flex w-[33vw]">
                                <ProgressBar
                                    height="h-8"
                                    transition="duration-500 transition-width"
                                    track="bg-surface-300-600-token"
                                    meter="bg-primary-500"
                                    value={attrs.stats.durationSpoken * 100 / maxDurationSpoken}
                                />
                            </div>
                        </div>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
      
</div>

<div data-popup="stats-button">
    <div class="card p-4 bg-surface-300-600-token">
        <div class="flex flex-col gap-2 overflow-hidden">
            <h4 class="h4">Configure Statistics</h4>
            <button class="btn variant-filled-primary" onclick={exportStats}>Export Stats</button>
            <button class="btn variant-filled-error" onclick={clearStats}>Clear Stats</button>
        </div>
    </div>
</div>