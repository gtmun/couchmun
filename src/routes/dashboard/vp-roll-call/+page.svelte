<script lang="ts">
    import { SvelteMap } from "svelte/reactivity";
    import { fly, slide } from "svelte/transition";
    
    import PaginatorDots from "$lib/components/controls/PaginatorDots.svelte";
    import ToggleButton from "$lib/components/controls/ToggleButton.svelte";
    import TimerPanel from "$lib/components/motions/TimerPanel.svelte";
    import RollCall, { notPendingThen, type RollCallEntry } from "$lib/components/RollCall.svelte";
    import SpeakerList, { createSpeaker } from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import type { DelegateID, Speaker } from "$lib/types";
    import { watchEffect } from "$lib/util/sv.svelte";
    import { parseTime } from "$lib/util/time";
    import MdiAccountCancel from "~icons/mdi/account-cancel";
    import MdiAccountCheck from "~icons/mdi/account-check";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiCheck from "~icons/mdi/check";
    import MdiChevronLeft from "~icons/mdi/chevron-left";
    import MdiChevronRight from "~icons/mdi/chevron-right";
    import MdiEye from "~icons/mdi/eye";
    import MdiEyeOff from "~icons/mdi/eye-off";
    import MdiOctagon from "~icons/mdi/octagon";
    import MdiTimerSand from "~icons/mdi/timer-sand";

    const { delegates } = getSessionContext();

    // Pagination:
    const pageNames = ["Roll Call", "Roll Call (Passes)", "Right to Speak", "Final Votes"];
    const totalPages = pageNames.length;
    let page = $state<number>(0);
    let pageIncreased = $state(true);
    function setPage(newPage: number) {
        pageIncreased = Math.sign(newPage - page) >= 0;
        page = Math.min(Math.max(0, newPage), totalPages - 1);
    }

    // Vote handling:
    const ROLL_CALL_VOTES = ["Y", "N", "A", "YR", "NR", "P"] as const;
    const RCV2_DENIED = ["A", "P"] as const;
    type RollCallVote = typeof ROLL_CALL_VOTES[number];
    type RollCallVoteP = Exclude<RollCallVote, "A" | "P">;
    
    let votes1 = new SvelteMap<DelegateID, RollCallVote>();
    let votes2 = new SvelteMap<DelegateID, RollCallVoteP>();
    const votes = $derived.by(() => {
        const votes = new SvelteMap<DelegateID, RollCallVote>(votes1);
        for (let [d, v] of votes2) {
            votes.set(d, v);
        }

        return votes;
    });
    const voteCounts = $derived.by(() => {
        const ct = { "Y": 0, "N": 0, "A": 0 };
        for (let v of votes.values()) {
            if (v == "YR") v = "Y";
            if (v == "NR") v = "N";
            if (v == "P") continue;
            
            ct[v] ??= 0;
            ct[v]++;
        }
        return ct;
    })
    let showVotes = $state(false);

    const entries = [
        {
            value: "Y",
            label: "Yes",
            icon: MdiCheck,
            indicatorCls: "preset-filled-success-800-200"
        },
        {
            value: "N",
            label: "No",
            icon: MdiCancel,
            indicatorCls: "preset-filled-error-800-200"
        },
        {
            value: "A",
            label: "Abstain",
            icon: MdiOctagon,
            disabled: d => d.presence == "PV"
        },
        {
            value: "YR",
            label: "Yes with Rights",
            icon: MdiAccountCheck,
            indicatorCls: "preset-filled-success-800-200"
        },
        {
            value: "NR",
            label: "No with Rights",
            icon: MdiAccountCancel,
            indicatorCls: "preset-filled-error-800-200"
        },
        {
            value: "P",
            label: "Pass",
            icon: MdiTimerSand,
            indicatorCls: "preset-filled-warning-800-200"
        },
    ] as const satisfies RollCallEntry[];
    const entriesP = entries.filter(({ value }) => !(RCV2_DENIED as readonly string[]).includes(value));
    const ENTRIES_MAP = Object.fromEntries(entries.map(e => [e.value, e])) as Record<RollCallVote, RollCallEntry>;

    const delsRC = $derived(notPendingThen($delegates, dels => dels.filter(d => d.isPresent())));
    const delsRCP = $derived(notPendingThen(delsRC, dels => dels.filter(d => votes1.get(d.id) === "P")));
    const delsRights = $derived(notPendingThen($delegates, dels => dels.filter(d => votes.get(d.id) === "YR" || votes.get(d.id) === "NR")));

    function asVote(r: string | null): RollCallVote | undefined {
        if (r && (ROLL_CALL_VOTES as readonly string[]).includes(r)) return r as RollCallVote;
    }

    // Speakers list
    let rightsSpeakersList = $state<SpeakerList>();
    let rightsTimerPanel = $state<TimerPanel>();
    let rightsDuration = $state(60);
    let rightsDurInput = $state("");
    function setDuration(e: SubmitEvent) {
        e.preventDefault();

        let secs = parseTime(rightsDurInput);
        if (typeof secs !== "undefined") {
            rightsDuration = secs;
        }
        rightsDurInput = "";
    }
    let rightsOrder = $state<Speaker[]>([]);
    watchEffect(() => [page, delsRights] as const, ([page, dels]) => {
        // Only allow overriding the rights order on other pages
        // Technically shouldn't be needed but for whatever reason,
        // delsRights can spuriously update on this page.
        if (page !== 2) {
            rightsOrder = dels.map(d => createSpeaker(d.id));
        }
    });

    // Animations
    const flyIn  = (e: Element) => fly(e, { x: pageIncreased ? "100%" : "-100%", y: 0, duration: 300 });
    const flyOut = (e: Element) => fly(e, { x: pageIncreased ? "-100%" : "100%", y: 0, duration: 300 });

    // misc
    const pagesDisabled = $derived([false, delsRCP.length == 0, delsRights.length == 0, false]);
</script>

<div class="flex flex-col h-full gap-3">
    <!-- Top bar -->
    <div class="grid grid-cols-3 items-center">
        <div class="flex">
            {#key page}
                <div class="text-nowrap overflow-hidden" transition:slide={{ axis: "x" }}>
                    {pageNames[page]}
                </div>
            {/key}
        </div>
        <PaginatorDots
            {totalPages}
            bind:page={() => page, p => setPage(p)}
            disabled={pagesDisabled}
        />
        <div class="flex justify-end items-center h-6">
            {#if page != 3}
                <div class="flex items-center gap-3" transition:slide={{ axis: "x" }}>
                    <div 
                        class="flex text-success-800-200"
                        aria-label="Yes: {showVotes ? voteCounts.Y : 'Hidden'}"
                        title="Yes: {showVotes ? voteCounts.Y : 'Hidden'}"
                    >
                        <ENTRIES_MAP.Y.icon />
                        <div class="tabular-nums">{showVotes ? voteCounts.Y : '-'}</div>
                    </div>
                    <div 
                        class="flex text-error-800-200"
                        aria-label="No: {showVotes ? voteCounts.N : 'Hidden'}"
                        title="No: {showVotes ? voteCounts.N : 'Hidden'}"
                    >
                        <ENTRIES_MAP.N.icon />
                        <div class="tabular-nums">{showVotes ? voteCounts.N : '-'}</div>
                    </div>
                    <div 
                        class="flex"
                        aria-label="Abstain: {showVotes ? voteCounts.A : 'Hidden'}"
                        title="Abstain: {showVotes ? voteCounts.A : 'Hidden'}"
                    >
                        <ENTRIES_MAP.A.icon />
                        <div class="tabular-nums">{showVotes ? voteCounts.A : '-'}</div>
                    </div>
                    <ToggleButton name="show-vote-mini" bind:checked={showVotes}>
                        {#snippet activeChild()}
                            <MdiEye />
                        {/snippet}
                        {#snippet inactiveChild()}
                            <MdiEyeOff />
                        {/snippet}
                    </ToggleButton>
                </div>
            {/if}
        </div>
    </div>
    <hr class="hr" />
    <!-- Main content -->
    <div class="grow overflow-auto">
        <div class="relative h-full">
            {#key page}
            <div class="w-full h-full absolute" in:flyIn out:flyOut>
                {#if page == 0}
                <!-- Roll call -->
                <RollCall
                    getValue={d => votes1.get(d.id) ?? null}
                    setValue={(s, d) => {
                        let v = asVote(s);
                        if (v) votes1.set(d.id, v);
                    }}
                    delegates={delsRC}
                    {entries}
                />
                {:else if page == 1}
                <!-- Passes -->
                <RollCall
                    getValue={d => votes2.get(d.id) ?? null}
                    setValue={(s, d) => {
                        let v = asVote(s);
                        if (v && v != "A" && v != "P") votes2.set(d.id, v);
                    }}
                    delegates={delsRCP}
                    entries={entriesP}
                />
                {:else if page == 2}
                <!-- Y/N with rights -->
                <div class="flex flex-col lg:flex-row h-full gap-8 items-stretch">
                <!--
                    Under mobile, the timer encompasses the whole page 
                    and the speakers list can be accessed by scrolling down.

                    Under desktop, both are on the same screen,
                    with the left side being the timer and the right side being the speakers list.
                -->
                <!-- Left/Top -->
                <div class="flex flex-col grow shrink-0 basis-full lg:basis-auto">
                    <TimerPanel
                        delegates={$delegates}
                        speakersList={rightsSpeakersList}
                        durations={[rightsDuration]}
                        onDurationUpdate={(_, d) => rightsDuration = d}
                        bind:this={rightsTimerPanel}
                        editable
                    >
                        {#snippet label(name)}
                            {@const speaker = rightsSpeakersList?.selectedSpeaker()}
                            {#if speaker}
                                {@const vote = votes.get(speaker.key)}
                                <div class="flex items-center">
                                    <h2 class="h2">{name}</h2>
                                    {#if vote == "YR"}
                                        <ENTRIES_MAP.Y.icon class="size-8 ml-3" />
                                    {:else if vote == "NR"}
                                        <ENTRIES_MAP.N.icon class="size-8 ml-3" />
                                    {/if}
                                </div>
                            {/if}
                        {/snippet}
                    </TimerPanel>
                </div>
                <!-- Right/Bottom -->
                <div class="flex flex-col gap-4 h-full lg:overflow-hidden xl:min-w-100 lg:max-w-[33%]">
                    <!-- List -->
                    <SpeakerList
                        delegates={$delegates}
                        bind:order={rightsOrder}
                        bind:this={rightsSpeakersList}
                        onBeforeSpeakerUpdate={() => rightsTimerPanel?.reset()}
                        onMarkComplete={(key, isRepeat) => { if (!isRepeat) db.updateDelegate(key, d => { d.stats.timesSpoken++; }) }}
                    >
                        {#snippet controls()}{/snippet}
                    </SpeakerList>
                    <!-- Timer config -->
                    <div class="flex flex-row gap-5">
                        <form class="contents" onsubmit={setDuration}>
                            <label class="flex grow items-center">
                                <span>Speaker Time</span>
                                <input class="input grow" bind:value={rightsDurInput} placeholder="mm:ss" disabled={rightsTimerPanel?.getRunState(0)} />
                            </label>
                        </form>
                    </div>
                </div>
            </div>
                {:else if page == 3}
                <!-- Final count -->
                <div class="flex flex-col h-full items-center justify-center">
                    <div class="flex items-center gap-3">
                        <h3 class="h3">
                            Votes
                        </h3>
                        <ToggleButton name="show-vote" bind:checked={showVotes}>
                            {#snippet activeChild()}
                                <MdiEye />
                            {/snippet}
                            {#snippet inactiveChild()}
                                <MdiEyeOff />
                            {/snippet}
                        </ToggleButton>
                    </div>
                    <div class="text-3xl">
                        <div 
                            class="flex gap-2 items-center text-success-800-200"
                            aria-label="Yes: {showVotes ? voteCounts.Y : 'Hidden'}"
                            title="Yes: {showVotes ? voteCounts.Y : 'Hidden'}"
                        >
                            <ENTRIES_MAP.Y.icon />
                            <div class="tabular-nums">{showVotes ? voteCounts.Y : '-'}</div>
                        </div>
                        <div 
                            class="flex gap-2 items-center text-error-800-200"
                            aria-label="No: {showVotes ? voteCounts.N : 'Hidden'}"
                            title="No: {showVotes ? voteCounts.N : 'Hidden'}"
                        >
                            <ENTRIES_MAP.N.icon />
                            <div class="tabular-nums">{showVotes ? voteCounts.N : '-'}</div>
                        </div>
                        <div 
                            class="flex gap-2 items-center"
                            aria-label="Abstain: {showVotes ? voteCounts.A : 'Hidden'}"
                            title="Abstain: {showVotes ? voteCounts.A : 'Hidden'}"
                        >
                            <ENTRIES_MAP.A.icon />
                            <div class="tabular-nums">{showVotes ? voteCounts.A : '-'}</div>
                        </div>
                    </div>
                </div>
                {/if}
            </div>
            {/key}
        </div>
    </div>
    <hr class="hr" />
    <!-- Bottom buttons -->
    <div class="flex justify-between">
        <button 
            class={["btn preset-filled-primary-500", page <= 0 && "invisible"]}
            onclick={() => setPage(page - 1)}
        >
            <MdiChevronLeft />
            Previous
        </button>
        <button 
            class={["btn preset-filled-primary-500", page >= totalPages - 1 && "invisible"]}
            onclick={() => setPage(page + 1)}
        >
            Next
            <MdiChevronRight />
        </button>
    </div>
</div>