<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
    import { formatValidationError, nonEmptyString } from "$lib/motions/form_validation";
    import type { DelegateAttrs, Speaker } from "$lib/types";
    
    import { type z } from "zod";
    import Icon from "@iconify/svelte";
    import { popup } from "@skeletonlabs/skeleton";
    import { sortable } from "$lib/util";
    import { tick } from "svelte";
    import { flip } from "svelte/animate";

    let dfltControlsInput: string = $state("");
    let dfltControlsError: string | undefined = $state(undefined);

    interface Props {
        /**
         * The order of speakers for the speaker's list.
         */
        order?: Speaker[];
        /**
         * A mapping of key to their delegate attributes.
         * 
         * If no entry exists for a given key, the speaker's key is displayed.
         */
        delegates?: Record<string, DelegateAttrs>;
        /**
         * If defined, this creates control options to allow for adding
         * and removing speakers from the speakers' list.
         * 
         * This doesn't need to be defined if:
         * 1. Adding delegates isn't required, or
         * 2. A custom control is implemented instead
         */
        useDefaultControls?: {
            presentDelegates: string[],
            validator: z.ZodType<string, any, any> | ((dels: Record<string, DelegateAttrs>, presentDels: string[]) => z.ZodType<string, any, any>),
            popupID?: string
        } | undefined;
        onBeforeSpeakerUpdate?: ((oldSpeaker: Speaker | undefined, newSpeaker: Speaker | undefined) => unknown) | undefined;
        onMarkComplete?: ((key: string, isRepeat: boolean) => unknown) | undefined;
    }

    let {
        order = $bindable([]),
        delegates = {},
        useDefaultControls = undefined,
        onBeforeSpeakerUpdate = undefined,
        onMarkComplete = undefined
    }: Props = $props();

    // Special IDs to track:
    let selectedSpeakerId: string | undefined = $state(undefined);
    let draggingSpeakerId: string | undefined = $state(undefined);
    // A mapping from IDs to Speakers:
    let orderMap = $derived(Object.fromEntries(
        order.flatMap((speaker, i) => typeof speaker?.id !== "undefined" ? [[speaker.id, { speaker, i }]] : [])
    ));

    // List item elements per order item
    let liElements = new Map<string, HTMLLIElement>();

    // Readonly values
    export function isAllDone() {
        return typeof selectedSpeakerId === "undefined" && order.every(({ completed }) => completed);
    }
    export function selectedSpeaker() {
        let speaker = findSpeaker(selectedSpeakerId);
        if (typeof speaker === "undefined") return;
        
        return { key: speaker.key, completed: speaker.completed };
        
    }
    //
    function getLabel(key: string) {
        return delegates?.[key]?.name ?? key;
    }
    function findSpeaker(speakerId: string | undefined): Speaker | undefined {
        if (typeof speakerId === "undefined") return;
        return orderMap[speakerId]?.speaker;
    }
    function markComplete(speakerId: string | undefined) {
        let speaker = findSpeaker(speakerId);
        if (typeof speaker !== "undefined") {
            onMarkComplete?.(speaker.key, speaker.completed);
            speaker.completed = true;
        }
        order = order;
    }
    export function start() {
        markComplete(selectedSpeakerId);
    }
    export function next() {
        markComplete(selectedSpeakerId);

        // Find first element in the order that has not been completed yet.
        setSelectedSpeaker(order.find(({ completed }) => !completed));
    }

    export function addSpeaker(name: string, clearControlInput: boolean = false) {
        const result = validator.safeParse(name);
        if (result.success) {
            const key = result.data;
            // Successful, so add speakers:
            let speaker = createSpeaker(key);
            order.push(speaker);
            order = order;

            // Jump to this speaker when DOM updates.
            tick().then(() => {
                gotoSpeaker(speaker.id);
            });

            if (typeof useDefaultControls !== "undefined") {
                dfltControlsError = undefined;
                // Clear the control input if it exists and it was requested to be cleared.
                if (clearControlInput) dfltControlsInput = "";
            }
        } else {
            dfltControlsError = formatValidationError(result.error).message;
        }
    }
    function submitSpeaker(e: SubmitEvent) {
        e.preventDefault();
        addSpeaker(dfltControlsInput, true);
    }
    function deleteSpeaker(i: number) {
        let [removedSpeaker] = order.splice(i, 1);
        order = order;
        
        if (removedSpeaker?.id === selectedSpeakerId) {
            setSelectedSpeaker(undefined);
        }
        if (removedSpeaker?.id === draggingSpeakerId) {
            draggingSpeakerId = undefined;
        }
    }

    /// Sets the selected speaker.
    function setSelectedSpeaker(speaker: Speaker | undefined) {
        if (selectedSpeakerId !== speaker?.id) {
            // Call beforeSpeakerUpdate (and let it run to completion if is Promise) before setting speaker.
            (async () => {
                let selectedSpeaker = findSpeaker(selectedSpeakerId);
                await onBeforeSpeakerUpdate?.(selectedSpeaker, speaker);
                selectedSpeakerId = speaker?.id;
            })()
        }
    }

    function getButton(i: number, btn: number): HTMLButtonElement | undefined {
        if (0 <= i && i < order.length) {
            return liElements.get(order[i].id)?.querySelectorAll("button")[btn];
        }
    }
    async function onKeyDown(e: KeyboardEvent, i: number, btn: number) {
        // On ctrl+up or ctrl+down, move speaker's list item:
        if (e.ctrlKey || e.metaKey) {
            if (e.code === "ArrowUp") {
                // Swap element with element before
                let im1 = Math.max(i - 1, 0);
                [order[im1], order[i]] = [order[i], order[im1]];
                // Update DOM, then apply focus to element
                await tick();
                getButton(im1, btn)?.focus();
            } else if (e.code === "ArrowDown") {
                // Swap element with element after
                let ip1 = Math.min(i + 1, order.length - 1);
                [order[i], order[ip1]] = [order[ip1], order[i]];
                // Update DOM, then apply focus to element
                await tick();
                getButton(ip1, btn)?.focus();
            }
        } else {
            // On up or down, move active element
            if (e.code === "ArrowUp") {
                getButton(i - 1, btn)?.focus();
            } else if (e.code === "ArrowDown") {
                getButton(i + 1, btn)?.focus();
            } else if (e.code === "ArrowLeft") {
                getButton(i, btn - 1)?.focus();
            } else if (e.code === "ArrowRight") {
                getButton(i, btn + 1)?.focus();
            }
        }
    }
    function gotoSpeaker(speakerId: string) {
        liElements.get(speakerId)?.scrollIntoView({ block: "nearest" });
    }
    // If order updates and selectedSpeaker isn't in there, then clear selectedSpeaker.
    // Scroll to speaker if it is out of view.
    $effect(() => {
        if (typeof selectedSpeakerId !== "undefined") {
            if (!(selectedSpeakerId in orderMap)) {
                setSelectedSpeaker(undefined);
            } else {
                gotoSpeaker(selectedSpeakerId);
            }
        }
    })

    const bindToMap = <K, V extends HTMLElement>(el: V, [map, key]: [Map<K, V>, K]) => {
        map.set(key, el);
        return { destroy() { map.delete(key); } }
    };
    // A11y dragging
    async function handleDragButton(s: Speaker) {
        // No currently dragging speaker, so set:
        if (typeof draggingSpeakerId === "undefined") {
            draggingSpeakerId = s.id;
            return;
        }

        // If we clicked on the speaker again, toggle off:
        if (draggingSpeakerId === s.id) {
            draggingSpeakerId = undefined;
            return;
        }

        let { i: x } = orderMap[draggingSpeakerId];
        let { i: y } = orderMap[s.id];
        
        draggingSpeakerId = undefined;
        if (x >= 0 && y >= 0) {
            [order[y], order[x]] = [order[x], order[y]];
            await tick();
            getButton(y, 0)?.focus();
        }
    }
    // Properties which are only used with default controls:
    let validator = $derived(
        typeof useDefaultControls?.validator === "function" 
        ? useDefaultControls?.validator(delegates, useDefaultControls.presentDelegates)
        : useDefaultControls?.validator ?? nonEmptyString()
    );
</script>
<script module lang="ts">
    /**
     * Creates a new speaker entry from a given key.
     * @param key The speaker's key
     * @param completed Whether this speaker has finished talking, by default false
     * @return the speaker object
     */
    export function createSpeaker(key: string, completed: boolean = false): Speaker {
        return { key, completed, id: crypto.randomUUID() }
    }
</script>

<div class="card p-4 overflow-y-auto flex-grow flex flex-col items-stretch gap-3">
    <h4 class="h4 flex justify-center">
        Speakers List
    </h4>
    <ol class="list grid grid-cols-[auto_auto_1fr_auto]" use:sortable={{
        animation: 150,
        swapThreshold: 0.9,
        ghostClass: "!bg-surface-400/25",
        dragClass: "!bg-surface-50",
        handle: ".handle",
        fallbackOnBody: true,
        store: {
            get: () => order.map(spk => spk.id),
            set: (sortable) => order = sortable.toArray().map(k => orderMap[k].speaker)}
    }}>
        {#each order as speaker, i (speaker.id)}
            {@const speakerLabel = getLabel(speaker.key)}
            {@const selected = speaker.id === selectedSpeakerId}
            
            {@const dragSelected = speaker.id === draggingSpeakerId}
            {@const draggingSpeaker = findSpeaker(draggingSpeakerId)}
            {@const dragBtnLabel = 
                dragSelected 
                ? `Stop Dragging ${speakerLabel}` 
                : typeof draggingSpeaker !== "undefined" 
                    ? `Swap ${getLabel(draggingSpeaker.key)} (${(orderMap[draggingSpeakerId ?? ""]?.i ?? -1) + 1}) with ${speakerLabel} (${i + 1})`
                    : `Start Dragging ${speakerLabel}`
            }
            <li
                class="!grid grid-cols-subgrid col-span-4"
                class:variant-ghost-primary={dragSelected}
                use:bindToMap={[liElements, speaker.id]}
                data-id={speaker.id}
                animate:flip={{ duration: 150 }}
            >
                <button
                    class="btn-icon handle cursor-grab"
                    aria-pressed={dragSelected}
                    onclick={() => handleDragButton(speaker)}
                    onkeydown={(e) => onKeyDown(e, i, 0)}
                    aria-label={dragBtnLabel}
                    title={dragBtnLabel}
                >
                    <Icon icon="mdi:drag-vertical" width="24" height="24" />
                </button>
                <span>{i + 1}.</span>
                <button 
                    class="btn flex overflow-clip"
                    class:variant-filled-primary={selected}
                    class:variant-soft-surface={!selected && speaker.completed}
                    class:variant-ringed-surface={!selected && !speaker.completed}
                    class:hover:variant-ringed-primary={!selected && !speaker.completed}
                    onclick={() => setSelectedSpeaker(speaker)}
                    onkeydown={(e) => onKeyDown(e, i, 1)}
                    title="Select {speakerLabel}"
                    aria-label="Select {speakerLabel}"
                    aria-pressed={selected}
                >
                    <DelLabel key={speaker.key} attrs={delegates[speaker.key]} inline />
                </button>
                <div class="btn-icon">
                    {#if !speaker.completed}
                        <button 
                            class="btn-icon variant-soft-surface hover:variant-filled-error" 
                            onclick={() => deleteSpeaker(i)}
                            onkeydown={(e) => onKeyDown(e, i, 2)}
                            title="Delete {speakerLabel}"
                            aria-label="Delete {speakerLabel}"
                        >
                            <Icon icon="mdi:cancel" />
                        </button>
                    {/if}
                </div>
            </li>
        {/each}
    </ol>
</div>

<!-- Default controls, consisting of a delegate input, an add button, and a clear button. -->
{#if typeof useDefaultControls !== "undefined"}
    {@const popupID = useDefaultControls.popupID ?? "addDelegatePopup"}
    {@const error = typeof dfltControlsError !== "undefined"}

    <div class="flex flex-col gap-1">
        <div class="flex flex-row gap-3">
            <!-- Add delegate -->
            <form class="contents" onsubmit={submitSpeaker} oninput={() => dfltControlsError = undefined}>
                <input 
                    class="input" 
                    class:input-error={error}
                    bind:value={dfltControlsInput}
                    use:popup={{ ...defaultPopupSettings(popupID), placement: "left-end", event: "focus-click" }}
                    {...defaultPlaceholder(useDefaultControls.presentDelegates.length === 0)}
                />
                <button
                    type="submit"
                    class="btn variant-filled-primary"
                    disabled={useDefaultControls.presentDelegates.length === 0}
                    aria-label="Add to Speakers List"
                    title="Add to Speakers List"
                >
                    Add
                </button>
            </form>
            <!-- Clear order -->
            <button
                type="submit"
                class="btn variant-filled-primary"
                disabled={order.length === 0}
                onclick={() => order = []}
                aria-label="Clear Speakers List"
                title="Clear Speakers List"
            >
                Clear
            </button>
        </div>
        <!-- Error messages! -->
        <div class="text-error-500 text-center transition-[height] overflow-hidden {error ? 'h-6' : 'h-0'}">
            {dfltControlsError ?? "\xA0"}
        </div>
    </div>

    <!-- Delegate popup. 
        Note: this is in the middle of the document, 
        so it might overlap with another element and cause visual bugs.

        The solution used here is to not put another element over the popup :)
    -->
    <DelPopup 
        {popupID}
        bind:input={dfltControlsInput}
        {delegates}
        presentDelegates={useDefaultControls.presentDelegates}
        on:selection={e => addSpeaker(e.detail.label, true)}
    />
{/if}