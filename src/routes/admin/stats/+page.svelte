<!--
  @component The admin stats page (used for viewing delegate statistics).
-->
<script lang="ts">
    import { Progress, Pagination, Popover, Portal } from "@skeletonlabs/skeleton-svelte";

    import DelCombobox from "$lib/components/controls/DelCombobox.svelte";
    import InputPlusMinus from "$lib/components/controls/InputPlusMinus.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { Delegate, findDelegate } from "$lib/db/delegates";
    import { db, queryStore, SessionDatabase } from "$lib/db/index.svelte";
    import type { DelegateID, DelSessionData, StatsData } from "$lib/types";
    import { compare, downloadFile, hasKey, lazyslide } from "$lib/util";
    import { POPUP_CARD_CLASSES } from "$lib/util/popup";
    import { parseTime, sanitizeTime, stringifyTime } from "$lib/util/time";
    import MdiArrowUp from "~icons/mdi/arrow-up";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";
    import MdiDatabaseExportOutline from "~icons/mdi/database-export-outline";
    import MdiDotsHorizontal from "~icons/mdi/dots-horizontal";
    import MdiMinus from "~icons/mdi/minus";
    import MdiPencil from "~icons/mdi/pencil";
    import MdiPlus from "~icons/mdi/plus";
    import MdiRhombusMediumOutline from "~icons/mdi/rhombus-medium-outline";
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

    // The page to use for stats.
    // - selectedPage is the page manually set by clicking the pagination buttons.
    //    If undefined, this falls back to the current session key or the last session.
    //    If selectedPage == nSessions, then a summary page for all sessions is displayed.
    // - displayPage is the true page to display on stats.
    //    This will be selectedPage if manually selected, otherwise it will be based on the other types.
    let selectedPage = $state<number>();
    let displayPage = $derived(
        selectedPage ?? $currentSessionKey ?? ($nSessions - 1)
    );
    
    let isAllSessions = $derived(displayPage === $nSessions);
    let isCurrentSession = $derived(displayPage === $currentSessionKey);
    let selectedSession = $derived($prevSessions[displayPage] ?? $delegates ?? []);

    const presentDelegateIds: Set<DelegateID> = $derived(new Set($delegates.map(d => d.id)));
    const sessionDelegates: Delegate[] = $derived.by(() => {
        if (isAllSessions) {
            // All sessions

            // Not a map that will be exposed.
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
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
        } else if (isCurrentSession) {
            // Current session:
            return $delegates;
        } else {
            // Past session:
            let sessionMap = new Map(selectedSession.map(d => [d.id, d.session]));
            return Array.from(
                $delegates,
                d => Object.assign(new Delegate(), d, sessionMap.get(d.id))
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
        return hasKey(COLUMNS, k);
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
    let popupsOpen = $state({
        editStats: false,
        exportStats: false,
    });

    let editStatsDel = $state<DelegateID | undefined>(undefined);
    let editStatsTimeGuide = $state(false);
    let editStatsTimeInput = $state("");
    const durationButtons = [
        { type: "btn", time: -60, label: "-1:00" },
        { type: "btn", time: -45, label: "-:45" },
        { type: "btn", time: -30, label: "-:30" },
        { type: "sep" },
        { type: "btn", time: 30, label: "+:30" },
        { type: "btn", time: 45, label: "+:45" },
        { type: "btn", time: 60, label: "+1:00" },
    ] as const;
    function resetEditStats() {
        editStatsDel = undefined;
        editStatsTimeGuide = false;
        editStatsTimeInput = "";
    }
    async function addToDuration(delId: DelegateID | undefined, secs: number) {
        if (Number.isFinite(secs)) {
            return db.updateDelegate(delId, d => {
                d.stats.durationSpoken = Math.max(0, d.stats.durationSpoken + secs * 1000)
            });
        }
    }

    function exportStats() {
        let data = {
            committee: $barTitle,
            delegates: $delegates.map(d => Object.assign(d.getAttributes(), { id: d.id })),
            session: selectedSession.filter(d => presentDelegateIds.has(d.id))
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
    <div class="flex items-center justify-between gap-2">
        <div class="flex items-center">
            <Pagination
                count={$nSessions + 1}
                pageSize={1}
                page={displayPage + 1}
                onPageChange={e => selectedPage = e.page - 1}
            >
                <Pagination.PrevTrigger>
                    <MdiChevronLeft />
                </Pagination.PrevTrigger>
                <Pagination.Context>
                    {#snippet children(pagination)}
                        {#each pagination().pages as page, index (page)}
                            {#if page.type === 'page'}
                                <Pagination.Item
                                    class="tabular-nums"
                                    {...page}
                                >
                                    {#if index == $nSessions}
                                        <!-- All sessions page -->
                                        <MdiStar /> 
                                    {:else}
                                        <div class="flex justify-center w-[1.5em]">
                                            {page.value}
                                        </div>
                                    {/if}
                                </Pagination.Item>
                            {:else}
                                <Pagination.Ellipsis {index}>
                                    <MdiDotsHorizontal />
                                </Pagination.Ellipsis>
                            {/if}
                        {/each}
                    {/snippet}
                </Pagination.Context>
                <Pagination.NextTrigger>
                    <MdiChevronRight />
                </Pagination.NextTrigger>
            </Pagination>
        </div>
        <div class="flex items-center gap-1">
            <Popover
                open={popupsOpen.editStats}
                onOpenChange={e => {
                    if (e.open) resetEditStats();
                    popupsOpen.editStats = e.open;
                }}
                positioning={{ placement: 'bottom' }}
            >
                <Popover.Trigger
                    class={["btn-icon-std", popupsOpen.editStats ? "preset-filled" : "preset-ui-depressed hover:preset-filled"]}
                    aria-label="Edit Stats"
                >
                    <MdiPencil />
                </Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content class={POPUP_CARD_CLASSES}>
                            {@const selectedDel = typeof editStatsDel !== "undefined" ? findDelegate($delegates, editStatsDel) : undefined}
                            <form class="flex flex-col gap-2 overflow-hidden" onsubmit={e => e.preventDefault()}>
                                <label>
                                    Session
                                    <input 
                                        class="input"
                                        type="number"
                                        min="1" max={$nSessions}
                                        bind:value={
                                            () => Math.max(0, Math.min(displayPage, $nSessions - 1)) + 1,
                                            p => selectedPage =  Math.max(0, Math.min(p - 1, $nSessions - 1))
                                        }
                                    >
                                </label>
                                <label>
                                    Delegate
                                    <DelCombobox delegates={$delegates} bind:value={editStatsDel} />
                                </label>
                                {#if typeof selectedDel !== "undefined"}
                                    <div class="flex flex-col gap-2" transition:lazyslide>
                                        <label>
                                            Motions Proposed
                                            <InputPlusMinus 
                                                name="stats-motions-proposed"
                                                ariaLabelName="Motions Proposed"
                                                min={0}
                                                bind:value={
                                                    () => selectedDel.stats.motionsProposed,
                                                    v => db.updateDelegate(editStatsDel, d => { d.stats.motionsProposed = v; })
                                                }
                                            />
                                        </label>
                                        <label>
                                            Motions Accepted
                                            <InputPlusMinus
                                                name="stats-motions-accepted"
                                                ariaLabelName="Motions Accepted"
                                                min={0}
                                                bind:value={
                                                    () => selectedDel.stats.motionsAccepted,
                                                    v => db.updateDelegate(editStatsDel, d => { d.stats.motionsAccepted = v; })
                                                }
                                            />
                                        </label>
                                        <label>
                                            Times Spoken
                                            <InputPlusMinus
                                                name="stats-times-spoken"
                                                ariaLabelName="Times Spoken"
                                                min={0}
                                                bind:value={
                                                    () => selectedDel.stats.timesSpoken,
                                                    v => db.updateDelegate(editStatsDel, d => { d.stats.timesSpoken = v; })
                                                }
                                            />
                                        </label>
                                        <div class="flex flex-col gap-1">
                                            <label class="tabular-nums" for="stats-duration-spoken">
                                                Duration Spoken &middot; {stringifyTime(selectedDel.stats.durationSpoken / 1000, "round")}
                                            </label>
                                            {#if editStatsTimeGuide}
                                                <!-- Time guide
                                                <span class="text-surface-500" transition:fade={{ duration: 150 }}>
                                                    &middot; {sanitizeTime(editStatsTimeInput)}
                                                </span> -->
                                            {/if}
                                            <div class="flex gap-1">
                                                <!-- durationButtons is const, so this will not update -->
                                                <!-- eslint-disable-next-line svelte/require-each-key -->
                                                {#each durationButtons as item}
                                                    {#if item.type === "sep"}
                                                        <span><MdiRhombusMediumOutline /></span>
                                                    {:else if item.type === "btn"}
                                                        <button 
                                                            type="button"
                                                            class={["btn btn-sm tabular-nums", item.time < 0 ? "preset-filled-error-800-200" : "preset-filled-success-800-200"]}
                                                            onclick={() => addToDuration(editStatsDel, item.time)}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    {/if}
                                                {/each}
                                            </div>
                                            <div class="flex gap-1 items-center">
                                                <input 
                                                    name="stats-duration-spoken"
                                                    class="input"
                                                    placeholder="mm:ss"
                                                    bind:value={editStatsTimeInput}
                                                    onfocus={() => editStatsTimeGuide = true}
                                                    onblur={() => { editStatsTimeGuide = false; editStatsTimeInput = sanitizeTime(editStatsTimeInput); }}
                                                >
                                                <button
                                                    type="button"
                                                    class="btn-icon preset-filled"
                                                    onclick={() => addToDuration(editStatsDel, -parseTime(editStatsTimeInput)!)}
                                                    aria-label="Remove from Duration Spoken"
                                                    title="Remove from Duration Spoken"
                                                >
                                                    <MdiMinus />
                                                </button>
                                                <button
                                                    type="button"
                                                    class="btn-icon preset-filled"
                                                    onclick={() => addToDuration(editStatsDel, +parseTime(editStatsTimeInput)!)}
                                                    aria-label="Add to Duration Spoken"
                                                    title="Add to Duration Spoken"
                                                >
                                                    <MdiPlus />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </form>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover>
            <Popover
                open={popupsOpen.exportStats}
                onOpenChange={e => popupsOpen.exportStats = e.open}
                positioning={{ placement: 'bottom' }}
            >
                <Popover.Trigger
                    class="btn-icon-std preset-filled-warning-500"
                    aria-label="Export Stats"
                >
                    <MdiDatabaseExportOutline />
                </Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content class={POPUP_CARD_CLASSES}>
                            <Popover.Title class="flex justify-center text-lg font-bold">
                                Export Statistics
                            </Popover.Title>
                            <Popover.Description>
                                <div class="flex flex-col gap-2 overflow-hidden">
                                    <button class="btn preset-filled-primary-500" onclick={exportAllStats}>Export All Sessions</button>
                                    {#if !isAllSessions}
                                        <button class="btn preset-filled-primary-500" onclick={exportStats}>Export Session {displayPage + 1}</button>
                                    {/if}
                                </div>
                            </Popover.Description>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover>
        </div>
    </div>
    <div class="table-wrap rounded border border-surface-200-800">
        <table class="table">
            <thead class="preset-ui">
                <tr>
                    {#each Object.entries(COLUMNS) as [key, col] (key)}
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
                                <Progress value={maxDurationSpoken ? del.stats.durationSpoken * 100 / maxDurationSpoken : 0}>
                                    <Progress.Track class="bg-surface-100-900 h-8">
                                        <Progress.Range class="bg-primary-500 duration-500 transition-width" />
                                    </Progress.Track>
                                </Progress>
                            </div>
                        </div>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>