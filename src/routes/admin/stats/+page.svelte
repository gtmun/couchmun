<script lang="ts">
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db, queryStore, SessionDatabase } from "$lib/db/index.svelte";
    import { Delegate } from "$lib/db/delegates";
    import type { StatsData } from "$lib/types";
    import { compare, downloadFile } from "$lib/util";
    import { stringifyTime } from "$lib/util/time";
    
    import Icon from "@iconify/svelte";
    import { ProgressBar, type PopupSettings, popup, type PaginationSettings, Paginator } from "@skeletonlabs/skeleton";

    const { delegates, barTitle } = getSessionContext();

    // Pagination
    const prevSessions = queryStore(async () => {
        const arr = await db.prevSessions.toArray();
        return arr.map(e => e.val.delegates);
    }, []);
    const currentSessionKey = queryStore(() => db.getSessionValue("sessionKey"));

    const nSessions = queryStore(async () => {
        const nPrevSessions = await db.prevSessions.count();
        const currentSessionKey = await db.getSessionValue("sessionKey");
        return nPrevSessions + +(typeof currentSessionKey === "undefined");
    }, 0);

    let pageSettings: PaginationSettings = $state({
        page: -1,
        limit: 1,
        size: 0,
        amounts: []
    });
    $effect(() => {
        pageSettings.size = $nSessions;
        if (pageSettings.page === -1) pageSettings.page = $currentSessionKey ?? ($nSessions - 1);
    });

    const delAttrMap = $derived(new Map<number, Delegate>($delegates.map(d => [d.id, d])));
    let sessionDelegates = $derived.by(() => {
        let session = $prevSessions[pageSettings.page];

        if (pageSettings.page === $currentSessionKey || !session) {
            // Current session:
            return $delegates;
        } else {
            // Previous session:
            return session.map<Delegate>(
                d => Object.assign(Object.create(Delegate.prototype), delAttrMap.get(d.id), d.session)
            );
        }
    });

    // Sorting
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

    // Display stats:
    let maxDurationSpoken = $derived(Math.max(0, ...sessionDelegates.map(d => d.stats.durationSpoken)));
    let displayEntries = $derived(
        Array.from(sessionDelegates)
            .sort((e1, e2) => {
                let { item, descending } = sortOrder;
                return compare(readEntryValue(e1, item), readEntryValue(e2, item), descending);
            })
    );

    // Configuration
    const CONFIGURE_MODAL_SETTINGS: PopupSettings = {
        event: "focus-click",
        target: "stats-button",
        closeQuery: ''
    }
    function exportStats() {
        let data = {
            committee: $barTitle,
            delegates: $delegates.map(d => d.getAttributes()),
            session: SessionDatabase.delegatesAsSessionData($delegates)
        };
        downloadFile("couchmun-del-stats.json", JSON.stringify(data), "application/json");
    }
    function exportAllStats() {
        let data = {
            committee: $barTitle,
            delegates: $delegates.map(d => d.getAttributes()),
            sessions: [
                ...$prevSessions,
                SessionDatabase.delegatesAsSessionData($delegates)
            ]
        };
        downloadFile("couchmun-del-stats-all.json", JSON.stringify(data), "application/json");
    }
</script>

<MetaTags title="Stats Screen &middot; CouchMUN (Admin)" />

<div class="flex flex-col gap-1">
    <div class="flex items-center justify-end gap-2">
        <Paginator showNumerals bind:settings={pageSettings} />
        <button 
            class="btn-icon variant-filled-warning"
            aria-label="Edit Stats"
            title="Edit Stats"
            use:popup={CONFIGURE_MODAL_SETTINGS}
        >
            <Icon icon="mdi:database-export-outline" width="24" height="24" />
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
                {#each displayEntries as del (del.id)}
                {@const absent = !del.isPresent()}
                <tr class:!bg-surface-300-600-token={absent}>
                    <td class="!align-middle">
                        {#if absent}
                        <div class="flex gap-1">
                            <span class="line-through italic">
                                <DelLabel attrs={del} inline />
                            </span>
                            <span class="text-error-500-400-token">
                                (Absent)
                            </span>
                        </div>
                        {:else}
                        <DelLabel attrs={del} inline />
                        {/if}
                    </td>
                    <td class="!align-middle">{del.stats.motionsProposed}</td>
                    <td class="!align-middle">{del.stats.motionsAccepted}</td>
                    <td class="!align-middle">{del.stats.timesSpoken}</td>
                    <td class="!align-middle">
                        <div class="flex items-center justify-end gap-3">
                            {stringifyTime(del.stats.durationSpoken / 1000, "round")}
                            <div class="flex w-[33vw]">
                                <ProgressBar
                                    height="h-8"
                                    transition="duration-500 transition-width"
                                    track="bg-surface-300-600-token"
                                    meter="bg-primary-500"
                                    value={del.stats.durationSpoken * 100 / maxDurationSpoken}
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
            <h4 class="h4">Export Statistics</h4>
            <button class="btn variant-filled-primary" onclick={exportAllStats}>Export All Sessions</button>
            <button class="btn variant-filled-primary" onclick={exportStats}>Export Session {pageSettings.page + 1}</button>
        </div>
    </div>
</div>