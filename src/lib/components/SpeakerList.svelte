<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
    import { formatValidationError, nonEmptyString } from "$lib/motions/form_validation";
    import type { DelegateAttrs, Speaker } from "$lib/types";
    
    import { type z } from "zod";
    import Icon from "@iconify/svelte";
    import { getModalStore, popup } from "@skeletonlabs/skeleton";
    import { tick, untrack } from "svelte";
    import { flip } from "svelte/animate";
    import { dragHandle, dragHandleZone } from "svelte-dnd-action";
    import { getDndItemId, isDndShadow, processDrag } from "$lib/util/dnd";
    import { triggerConfirmModal } from "$lib/util";

    let dfltControlsInput: string = $state("");
    let dfltControlsError: string | undefined = $state(undefined);

    const modalStore = getModalStore();

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
    // A mapping from IDs to Speakers:
    let orderMap = $derived(Object.fromEntries(
        order.filter(s => typeof s.id === "string" && s.id)
            .map((speaker, i) => [getDndItemId(speaker), { speaker, i }])
    ));

    // List item elements per order item
    let liElements = new Map<string, HTMLLIElement>();

    // Readonly values
    export function isAllDone() {
        return typeof selectedSpeakerId === "undefined" && order.every(({ completed }) => completed);
    }

    /**
     * Gets the data for the current selected speaker.
     */
    export function selectedSpeaker() {
        let speaker = findSpeaker(selectedSpeakerId);

        // This only updates when ID updates, not when the speaker's properties update:
        return untrack(() => {
            if (typeof speaker !== "undefined") {
                return { key: speaker.key, completed: speaker.completed };
            }
        });
        
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
    }
    function clearSpeakers() {
        triggerConfirmModal(
            modalStore, "Are you sure you want to clear the Speakers List?",
            () => order = []
        );
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

<div class="card p-4 overflow-y-hidden flex-grow flex flex-col items-stretch gap-4">
    <h4 class="h4 flex justify-center" id="speaker-list-header">
        Speakers List
    </h4>

    <ol class="p-2 list overflow-y-auto grid grid-cols-[auto_auto_1fr_auto] auto-rows-min flex-grow" use:dragHandleZone={{
        items: order,
        flipDurationMs: 150,
        dropTargetStyle: {},
        transformDraggedElement: (el, data, index) => {
            // Update number on dragged element:
            let idxEl = el?.querySelector(".enumerated-index");
            if (idxEl && typeof index === "number") {
                idxEl.textContent = `${index + 1}.`;
            }
        }
    }}
        onconsider={(e) => order = processDrag(e)}
        onfinalize={(e) => order = processDrag(e)}
        aria-labelledby="speaker-list-header"
    >
        {#each order as speaker, i (speaker.id)}
            {@const speakerLabel = getLabel(speaker.key)}
            {@const selected = speaker.id === selectedSpeakerId}
            {@const shadow = isDndShadow(speaker)}
            <li
                class="!grid grid-cols-subgrid col-span-4 self-start dnd-list-item"
                class:!visible={shadow}
                class:!bg-surface-300-600-token={shadow}
                use:bindToMap={[liElements, speaker.id]}
                animate:flip={{ duration: 150 }}
                aria-label={speakerLabel}
            >
                <div class="btn-icon" use:dragHandle>
                    <Icon icon="mdi:drag-vertical" width="24" height="24" />
                </div>
                <span class="enumerated-index">{i + 1}.</span>
                <button 
                    class="btn overflow-clip"
                    class:variant-filled-primary={selected}
                    class:variant-soft-surface={!selected && speaker.completed}
                    class:variant-ringed-surface={!selected && !speaker.completed}
                    class:hover:variant-ringed-primary={!selected && !speaker.completed}
                    onclick={() => setSelectedSpeaker(speaker)}
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
                onclick={clearSpeakers}
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
</div>

<style lang="postcss">
    /* Styling for dragged element */
    :global(#dnd-action-dragged-el).dnd-list-item {
        @apply !bg-surface-50;
        @apply !grid grid-cols-[auto_auto_1fr_auto] gap-4;
        @apply !opacity-90;
    }
    :global(.dark #dnd-action-dragged-el).dnd-list-item {
        @apply !bg-surface-900;
    }
</style>