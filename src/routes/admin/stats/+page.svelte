<!--
  @component The admin stats page (used for viewing delegate statistics).
-->
<script lang="ts">
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db, queryStore, SessionDatabase } from "$lib/db/index.svelte";
    import { Delegate } from "$lib/db/delegates";
    import type { StatsData } from "$lib/types";
    import { compare, downloadFile } from "$lib/util";
    import { POPUP_CARD_CLASSES } from "$lib/util/popup";
    import { stringifyTime } from "$lib/util/time";
    
    import { Progress, Pagination, Popover } from "@skeletonlabs/skeleton-svelte";
    import MdiArrowUp from "~icons/mdi/arrow-up";
    import MdiDatabaseExportOutline from "~icons/mdi/database-export-outline";

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

    let pageSettings = $state({
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
    let statsPopupOpen = $state(false);
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

<MetaTags title="Stats Screen · CouchMUN (Admin)" />

<div class="flex flex-col gap-1">
    <div class="flex items-center justify-end gap-2">
        <!-- TODO: pagination -->
        <Pagination data={[1,2,3,4,5]} />
        <Popover
            open={statsPopupOpen}
            onOpenChange={e => statsPopupOpen = e.open}
            positioning={{ placement: 'bottom' }}
            triggerBase="preset-filled-warning-500"
            triggerClasses="btn-icon"
            triggerAriaLabel="Edit Stats"
            contentBase={POPUP_CARD_CLASSES}
            arrow
        >
            {#snippet trigger()}
                <MdiDatabaseExportOutline />
            {/snippet}
            {#snippet content()}
                <div class="flex flex-col gap-2 overflow-hidden">
                    <h4 class="h4">Export Statistics</h4>
                    <button class="btn preset-filled-primary-500" onclick={exportAllStats}>Export All Sessions</button>
                    <button class="btn preset-filled-primary-500" onclick={exportStats}>Export Session {pageSettings.page + 1}</button>
                </div>
            {/snippet}
        </Popover>
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
                                <MdiArrowUp class="{sortOrder.descending ? 'rotate-180' : ''} transition-[transform]" />
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
                <tr class:bg-surface-300-700!={absent}>
                    <td class="align-middle!">
                        {#if absent}
                        <div class="flex gap-1">
                            <span class="line-through italic">
                                <DelLabel attrs={del} inline />
                            </span>
                            <span class="text-error-600-400">
                                (Absent)
                            </span>
                        </div>
                        {:else}
                        <DelLabel attrs={del} inline />
                        {/if}
                    </td>
                    <td class="align-middle!">{del.stats.motionsProposed}</td>
                    <td class="align-middle!">{del.stats.motionsAccepted}</td>
                    <td class="align-middle!">{del.stats.timesSpoken}</td>
                    <td class="align-middle!">
                        <div class="flex items-center justify-end gap-3">
                            {stringifyTime(del.stats.durationSpoken / 1000, "round")}
                            <div class="flex w-[33vw]">
                                <Progress
                                    height="h-8"
                                    trackBg="bg-surface-300-700"
                                    meterBg="bg-primary-500"
                                    meterTransition="duration-500 transition-width"
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