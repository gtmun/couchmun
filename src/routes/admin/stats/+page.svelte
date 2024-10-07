<script lang="ts">
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import { defaultStats, getStatsContext } from "$lib/stores/stats";
    import type { StatsData } from "$lib/types";
    import { compare, mapObj } from "$lib/util";
    import { stringifyTime } from "$lib/util/time";
    
    import Icon from "@iconify/svelte";
    import { ProgressBar } from "@skeletonlabs/skeleton";

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();
    const { stats } = getStatsContext();
    delegateAttributes.subscribe($da => {
        $stats = mapObj($da, k => [k, $stats[k] ?? defaultStats()]);
    });
    let sortOrder: { item: SortKey, descending: boolean } = {
        item: "durationSpoken",
        descending: true
    };
    type SortKey = keyof StatsData | "delegate";
    const COLUMNS = {
        delegate: { label: "Delegate" },
        motionsProposed: { label: "Motions Proposed" },
        motionsAccepted: { label: "Motions Accepted" },
        timesSpoken: { label: "Times Spoken" },
        durationSpoken: { label: "Duration Spoken" },
    } satisfies Record<SortKey, unknown>;

    function readEntryValue(entry: readonly [string, StatsData], key: SortKey) {
        if (key === "delegate") return $delegateAttributes[entry[0]]?.name ?? key;
        return entry[1][key];
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

    $: maxDurationSpoken = Math.max(0, ...Object.values($stats).map(ent => ent.durationSpoken));
    $: displayEntries = Object.entries($stats)
        .sort((e1, e2) => {
            let { item, descending } = sortOrder;
            return compare(readEntryValue(e1, item), readEntryValue(e2, item), descending);
        });
</script>

<MetaTags title="Stats Screen &middot; CouchMUN (Admin)" />

<div class="table-container">
    <table class="table table-compact">
        <thead>
            <tr>
                {#each Object.entries(COLUMNS) as [key, col]}
                <th>
                    <button on:click={() => setSort(key)}>
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
            {#each displayEntries as [key, ent] (key)}
            {@const absent = !$presentDelegates.includes(key)}
            <tr class:!bg-surface-300-600-token={absent}>
                <td class="!align-middle">
                    {#if absent}
                    <div class="flex gap-1">
                        <span class="line-through italic">
                            <DelLabel {key} attrs={$delegateAttributes[key]} inline />
                        </span>
                        <span class="text-error-500-400-token">
                            (Absent)
                        </span>
                    </div>
                    {:else}
                    <DelLabel {key} attrs={$delegateAttributes[key]} inline />
                    {/if}
                </td>
                <td class="!align-middle">{ent.motionsProposed}</td>
                <td class="!align-middle">{ent.motionsAccepted}</td>
                <td class="!align-middle">{ent.timesSpoken}</td>
                <td class="!align-middle">
                    <div class="flex items-center justify-end gap-3">
                        {stringifyTime(ent.durationSpoken / 1000, "round")}
                        <div class="flex w-[33vw]">
                            <ProgressBar
                                height="h-8"
                                transition="duration-500 transition-width"
                                track="bg-surface-300-600-token"
                                meter="bg-primary-500"
                                value={ent.durationSpoken * 100 / maxDurationSpoken}
                            />
                        </div>
                    </div>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
</div>
  