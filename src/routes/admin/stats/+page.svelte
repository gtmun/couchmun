<!--
  @component The admin stats page (used for viewing delegate statistics).
-->
<script lang="ts">
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db, queryStore, SessionDatabase } from "$lib/db/index.svelte";
    import { Delegate } from "$lib/db/delegates";
    import type { DelegateID, DelSessionData, StatsData } from "$lib/types";
    import { compare, downloadFile } from "$lib/util";
    import { POPUP_CARD_CLASSES } from "$lib/util/popup";
    import { stringifyTime } from "$lib/util/time";
    
    import { Progress, Pagination, Popover } from "@skeletonlabs/skeleton-svelte";
    import MdiArrowUp from "~icons/mdi/arrow-up";
    import MdiDatabaseExportOutline from "~icons/mdi/database-export-outline";
    import MdiDotsHorizontal from "~icons/mdi/dots-horizontal";
    import MdiChevronRight from "~icons/mdi/chevron-right";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiStar from "~icons/mdi/star";

    const { delegates, barTitle } = getSessionContext();

    // Pagination
    const prevSessions = queryStore(
        async () => Array.from(await db.prevSessions.toArray(), e => e.val.delegates), []
    );
    const currentSessionKey = queryStore(() => db.getSessionValue("sessionKey"));

    const nSessions = queryStore(async () => {
        const nPrevSessions = await db.prevSessions.count();
        const currentSessionKey = await db.getSessionValue("sessionKey");
        return nPrevSessions + +(typeof currentSessionKey === "undefined");
    }, 0);

    let page = $state(-1);
    $effect(() => {
        // When either cSK or nSessions update, it'll force page to not be -1.
        if (page === -1) page = $currentSessionKey ?? ($nSessions - 1);
    });
    
    const presentDelegateIds: Set<DelegateID> = $derived(new Set($delegates.map(d => d.id)));
    const sessionDelegates: Delegate[] = $derived.by(() => {
        let session = $prevSessions[page] ?? [];

        if (page === $nSessions) {
            // All sessions
            let delStats = new Map<DelegateID, DelSessionData>();
            for (let del of $delegates) {
                delStats.set(del.id, del.getSessionData());
            }
            for (let session of $prevSessions) {
                for (let del of session) {
                    let currentData = delStats.get(del.id);
                    if (typeof currentData !== "undefined") {
                        if (currentData.presence == "NP") currentData.presence = del.session.presence;
                        currentData.stats.durationSpoken += del.session.stats.durationSpoken;
                        currentData.stats.motionsAccepted += del.session.stats.motionsAccepted;
                        currentData.stats.motionsProposed += del.session.stats.motionsProposed;
                        currentData.stats.timesSpoken += del.session.stats.timesSpoken;
                    } else {
                        delStats.set(del.id, del.session);
                    }
                }
            }

            return Array.from($delegates, d => Object.assign(new Delegate(), d, delStats.get(d.id)));
        } else if (page === $currentSessionKey || !session) {
            // Current session:
            return $delegates;
        } else {
            // Past session:
            let sessionMap = new Map(session.map(d => [d.id, d.session]));
            return Array.from($delegates, d => Object.assign(new Delegate(), d, sessionMap.get(d.id)));
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
            delegates: $delegates.map(d => Object.assign(d.getAttributes(), { id: d.id })),
            session: ($prevSessions[page] ?? []).filter(d => presentDelegateIds.has(d.id))
        };
        downloadFile("couchmun-del-stats.json", JSON.stringify(data), "application/json");
    }
    function exportAllStats() {
        let data = {
            committee: $barTitle,
            delegates: $delegates.map(d => Object.assign(d.getAttributes(), { id: d.id })),
            sessions: [
                ...$prevSessions.map(s => s.filter(d => presentDelegateIds.has(d.id))),
                SessionDatabase.delegatesAsSessionData($delegates)
            ]
        };
        downloadFile("couchmun-del-stats-all.json", JSON.stringify(data), "application/json");
    }
</script>

<MetaTags title="Stats Screen · CouchMUN (Admin)" />

<div class="flex flex-col gap-1">
    <div class="flex items-center justify-end gap-2">
        <Pagination
            data={Array.from({ length: $nSessions })}
            page={page + 1}
            onPageChange={e => page = e.page - 1}
            pageSize={1}
            background=""
            border=""
            gap="gap-0.5"
            buttonInactive="preset-ui-depressed"
        >
            {#snippet labelEllipsis()}<MdiDotsHorizontal />{/snippet}
            {#snippet labelNext()}<MdiChevronRight />{/snippet}
            {#snippet labelPrevious()}<MdiChevronLeft />{/snippet}
        </Pagination>
        <button
            class={[
                "btn-icon-std",
                page == $nSessions ? "preset-filled" : "preset-ui-depressed hover:preset-filled"
            ]}
            title="All Sessions"
            aria-label="All Sessions"
            onclick={() => page = $nSessions}
        >
            <MdiStar />
        </button>
        <Popover
            open={statsPopupOpen}
            onOpenChange={e => statsPopupOpen = e.open}
            positioning={{ placement: 'bottom' }}
            triggerBase="preset-filled-warning-500"
            triggerClasses="btn-icon-std"
            triggerAriaLabel="Edit Stats"
            contentBase={POPUP_CARD_CLASSES}
            arrow
            arrowBackground="bg-surface-50-950!"
        >
            {#snippet trigger()}
                <MdiDatabaseExportOutline />
            {/snippet}
            {#snippet content()}
                <div class="flex flex-col gap-2 overflow-hidden">
                    <h4 class="h4">Export Statistics</h4>
                    <button class="btn preset-filled-primary-500" onclick={exportAllStats}>Export All Sessions</button>
                    {#if page < $nSessions}
                        <button class="btn preset-filled-primary-500" onclick={exportStats}>Export Session {page + 1}</button>
                    {/if}
                </div>
            {/snippet}
        </Popover>
    </div>
    <div class="table-wrap rounded border border-surface-200-800">
        <table class="table">
            <thead class="preset-ui">
                <tr>
                    {#each Object.entries(COLUMNS) as [key, col]}
                    <th>
                        <button onclick={() => setSort(key)}>
                            {#if sortOrder.item === key}
                            <div class="flex items-center gap-1" aria-sort={sortOrder.descending ? "descending" : "ascending"}>
                                {col.label}
                                <MdiArrowUp class={["transition-transform", sortOrder.descending && "rotate-180"]} />
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
                <tr class={[absent ? "bg-surface-200-800" : "hover:preset-tonal-primary"]}>
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
                                    trackBg="bg-surface-100-900"
                                    meterBg="bg-primary-500"
                                    meterTransition="duration-500 transition-width"
                                    value={maxDurationSpoken ? del.stats.durationSpoken * 100 / maxDurationSpoken : 0}
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