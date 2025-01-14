<!--
  @component This component displays a list of speakers during a caucus,
  as well as providing a default method ot adding new speakers.

  This component handles the ability to select, delete, 
  and rearrange speakers in the speakers' list.
 -->
<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import DelAutocomplete, { autocompletePlaceholders } from "$lib/components/DelAutocomplete.svelte";
    import { type Delegate, findDelegate } from "$lib/db/delegates";
    import { formatValidationError, presentDelegateSchema } from "$lib/motions/form_validation";
    import type { DelegateID, Speaker, SpeakerEntryID } from "$lib/types";
    import { getDndItemId, isDndShadow, processDrag } from "$lib/util/dnd";
    import { triggerConfirmModal } from "$lib/util";
    
    import Icon from "@iconify/svelte";
    import { getModalStore, popup } from "@skeletonlabs/skeleton";
    import { tick, untrack, type Snippet } from "svelte";
    import { flip } from "svelte/animate";
    import { dragHandle, dragHandleZone } from "svelte-dnd-action";
    import { autocompletePopup, POPUP_CARD_CLASSES } from "$lib/util/popup";

    const modalStore = getModalStore();

    interface Props {
        /**
         * The order of speakers for the speaker's list.
         */
        order?: Speaker[];
        /**
         * The list of all delegates recognized by this component.
         */
        delegates?: Delegate[];
        /**
         * The controls at the bottom of the speaker list
         * which handle the addition of new speakers.
         * 
         * If this prop is defined, this overrides the default add delegate controls
         * provided by this component.
         */
        controls?: Snippet;
        /**
         * If this prop is defined, the function callback is activated right before a speaker changes.
         */
        onBeforeSpeakerUpdate?: ((oldSpeaker: Speaker | undefined, newSpeaker: Speaker | undefined) => unknown);
        /**
         * If this prop is defined, the function callback is activated when a speaker is marked as completed.
         */
        onMarkComplete?: ((key: DelegateID, isRepeat: boolean) => unknown);
    }

    let {
        order = $bindable([]),
        delegates = [],
        controls = undefined,
        onBeforeSpeakerUpdate = undefined,
        onMarkComplete = undefined
    }: Props = $props();

    // A clone of order used solely for use:dragHandleZone
    let dndItems = $state($state.snapshot(order));
    $effect(() => { dndItems = order; });

    // Input properties (the current input, any errors with input, and the input validator)
    // Input validator currently doesn't have support to be changed, but if needed,
    // just add a new prop for it.
    //
    // The `addDelInput` and `addDelError` properties only apply if `controls` is not defined.
    let addDelInput: string = $state("");
    let addDelError: string = $state("");
    let addDelValidator = $derived(presentDelegateSchema(delegates));

    /**
     * ID for target. (Cannot be changed, but if needed just add a prop for it.)
     */
    const POPUP_TARGET = "add-delegate-popup";

    // The UUID of the currently selected speaker object:
    let selectedSpeakerId = $state<SpeakerEntryID>();
    // A mapping from IDs to Speakers:
    let orderMap = $derived(Object.fromEntries(
        order.filter(s => typeof s.id === "string" && s.id)
            .map((speaker, i) => [getDndItemId(speaker), { speaker, i }])
    ));

    // List item elements per order item
    let liElements = new Map<SpeakerEntryID, HTMLLIElement>();
    function jumpToSpeaker(speakerId: string) {
        liElements.get(speakerId)?.scrollIntoView({ block: "nearest" });
    }

    /**
     * Whether the speaker's list is complete (there are no other speakers left in the list).
     */
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
    /**
     * Find the speaker object with this UUID.
     * @param speakerId the ID (or undefined)
     */
    function findSpeaker(speakerId: SpeakerEntryID | undefined): Speaker | undefined {
        if (typeof speakerId === "undefined") return;
        return orderMap[speakerId]?.speaker;
    }
    /**
     * Marks the speaker as completed (and activates any listeners bound to "onMarkComplete").
     * @param speakerId the ID (or undefined)
     */
    function markComplete(speakerId: SpeakerEntryID | undefined) {
        let speaker = findSpeaker(speakerId);
        if (typeof speaker !== "undefined") {
            onMarkComplete?.(speaker.key, speaker.completed);
            speaker.completed = true;
        }
        order = order;
    }

    /**
     * Starts the speaker's list.
     */
    export function start() {
        markComplete(selectedSpeakerId);
    }
    /**
     * Moves to the next speaker in the speaker's list.
     */
    export function next() {
        markComplete(selectedSpeakerId);

        // Find first element in the order that has not been completed yet.
        setSelectedSpeaker(order.find(({ completed }) => !completed));
    }

    /**
     * Adds a speaker to the speaker's list.
     * @param name The full name of the speaker (not a key; this is parsed by the default validator)
     * @param clearControlInput Whether this function call should clear the input (by default false)
     */
    export function addSpeaker(name: string, clearControlInput: boolean = false) {
        const result = addDelValidator.safeParse(name);
        if (result.success) {
            const key = result.data;
            // Successful, so add speakers:
            let speaker = createSpeaker(key);
            order.push(speaker);
            order = order;

            // Jump to this speaker when DOM updates.
            tick().then(() => jumpToSpeaker(speaker.id));

            // Only applies to default controls
            if (typeof controls === "undefined") {
                addDelError = "";
                // Clear the control input if it exists and it was requested to be cleared.
                if (clearControlInput) addDelInput = "";
            }
        } else {
            addDelError = formatValidationError(result.error).message;
        }
    }

    // DEFAULT CONTROLS
    /**
     * Wrapper around `addSpeaker`.
     */
    function submitSpeaker(e: SubmitEvent) {
        e.preventDefault();
        addSpeaker(addDelInput, true);
    }
    /**
     * Deletes the speaker at index i in the speaker's list.
     * @param i The index.
     */
    function deleteSpeaker(i: number) {
        let [removedSpeaker] = order.splice(i, 1);
        order = order;
        
        if (removedSpeaker?.id === selectedSpeakerId) {
            setSelectedSpeaker(undefined);
        }
    }
    /**
     * Remove all speakers from the speaker's list.
     */
    function clearSpeakers() {
        triggerConfirmModal(
            modalStore, "Are you sure you want to clear the Speakers List?",
            () => order = []
        );
    }
    /// Sets the selected speaker.

    /**
     * Sets the selected speaker and activates the "onBeforeSpeakerUpdate" listener.
     * 
     * In order to properly trigger `onBeforeSpeakerUpdate`, this method should be used,
     * and not `selectedSpeakerId = newId`.
     * 
     * @param speaker the speaker object (or undefined to clear speaker)
     */
    function setSelectedSpeaker(speaker: Speaker | undefined) {
        if (selectedSpeakerId !== speaker?.id) {
            // Call beforeSpeakerUpdate (and let it run to completion if is Promise) before setting speaker.
            (async () => {
                let selectedSpeaker = findSpeaker(selectedSpeakerId);
                await onBeforeSpeakerUpdate?.(selectedSpeaker, speaker);
                await tick();
                selectedSpeakerId = speaker?.id;
            })()
        }
    }

    // If order updates and selectedSpeaker isn't in there, then clear selectedSpeaker.
    // Scroll to speaker if it is out of view.
    $effect(() => {
        if (typeof selectedSpeakerId !== "undefined") {
            if (!(selectedSpeakerId in orderMap)) {
                setSelectedSpeaker(undefined);
            } else {
                jumpToSpeaker(selectedSpeakerId);
            }
        }
    })

    const bindToMap = <K, V extends HTMLElement>(el: V, [map, key]: [Map<K, V>, K]) => {
        map.set(key, el);
        return { destroy() { map.delete(key); } }
    };
</script>
<script module lang="ts">
    /**
     * Creates a new speaker entry from a given key.
     * @param key The speaker's key
     * @param completed Whether this speaker has finished talking, by default false
     * @return the speaker object
     */
    export function createSpeaker(key: DelegateID, completed: boolean = false): Speaker {
        return { key, completed, id: crypto.randomUUID() }
    }
</script>

<div class="card p-4 overflow-y-hidden flex-grow flex flex-col items-stretch gap-4">
    <h4 class="h4 flex justify-center" id="speaker-list-header">
        Speakers List
    </h4>

    <ol class="p-2 list overflow-y-auto grid grid-cols-[auto_auto_1fr_auto] auto-rows-min flex-grow" use:dragHandleZone={{
        items: dndItems,
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
        onconsider={(e) => dndItems = processDrag(e)}
        onfinalize={(e) => order = dndItems = processDrag(e)}
        aria-labelledby="speaker-list-header"
    >
        {#each dndItems as speaker, i (speaker.id)}
            {@const selected = speaker.id === selectedSpeakerId}
            {@const shadow = isDndShadow(speaker)}
            {@const delAttrs = findDelegate(delegates, speaker.key)}
            {@const speakerLabel = delAttrs?.name ?? "unknown"}

            <li
                class="!grid grid-cols-subgrid col-span-4 dnd-list-item"
                class:!visible={shadow}
                class:!bg-surface-300-600-token={shadow}
                use:bindToMap={[liElements, speaker.id]}
                animate:flip={{ duration: 150 }}
                aria-label={speakerLabel}
            >
                <div class="btn-icon w-6" use:dragHandle>
                    <Icon icon="mdi:drag-vertical" width="24" height="24" />
                </div>
                <span class="enumerated-index">{i + 1}.</span>
                <button 
                    class="btn !text-wrap p-2 px-5 justify-start rounded-lg overflow-hidden"
                    class:variant-filled-primary={selected}
                    class:variant-soft-surface={!selected && speaker.completed}
                    class:variant-ringed-surface={!selected && !speaker.completed}
                    class:hover:variant-ringed-primary={!selected && !speaker.completed}
                    onclick={() => setSelectedSpeaker(speaker)}
                    title="Select {speakerLabel}"
                    aria-label="Select {speakerLabel}"
                    aria-pressed={selected}
                >
                    <DelLabel attrs={delAttrs} fallbackName={speakerLabel} inline />
                </button>
                <div class="btn-icon">
                    <button 
                        class="btn-icon 
                            {speaker.completed ? "variant-soft-surface" : "variant-soft-error hover:variant-filled-error"}"
                        onclick={() => deleteSpeaker(i)}
                        title="Delete {speakerLabel}"
                        aria-label="Delete {speakerLabel}"
                        disabled={speaker.completed}
                    >
                        <Icon icon="mdi:cancel" />
                    </button>
                </div>
            </li>
        {/each}
    </ol>

    {#if controls}
        {@render controls()}
    {:else}
        <!-- Default controls, consisting of a delegate input, an add button, and a clear button. -->
        {@const error = !!addDelError}
        {@const noDelegatesPresent = delegates.every(d => !d.isPresent())}

        <div class="flex flex-col gap-1">
            <div class="flex flex-row gap-1">
                <!-- Add delegate -->
                <form class="contents" onsubmit={submitSpeaker} oninput={() => addDelError = ""}>
                    <input 
                        class="input" 
                        class:input-error={error}
                        bind:value={addDelInput}
                        use:popup={{ ...autocompletePopup(POPUP_TARGET), placement: "left-end" }}
                        {...autocompletePlaceholders(noDelegatesPresent)}
                    />
                    <div class="ml-2">
                        <button
                            type="submit"
                            class="btn btn-icon variant-filled-primary"
                            disabled={noDelegatesPresent}
                            aria-label="Add to Speakers List"
                            title="Add to Speakers List"
                        >
                            <Icon icon="mdi:plus" width="24" height="24" />
                        </button>
                    </div>
                    <div>
                        <!-- Clear order -->
                        <button
                            type="button"
                            class="btn btn-icon variant-filled-primary"
                            disabled={order.length === 0}
                            onclick={clearSpeakers}
                            aria-label="Clear Speakers List"
                            title="Clear Speakers List"
                        >
                            <Icon icon="mdi:delete" width="24" height="24" />
                        </button>
                    </div>
                </form>
            </div>
            <!-- Error messages! -->
            <div class="text-error-500 text-center transition-[height] overflow-hidden {error ? 'h-6' : 'h-0'}">
                {addDelError || "\xA0"}
            </div>
        </div>

        <!-- Delegate popup. 
            Note: this is in the middle of the document, 
            so it might overlap with another element and cause visual bugs.

            The solution used here is to not put another element over the popup :)
        -->
        <div class="{POPUP_CARD_CLASSES}" data-popup={POPUP_TARGET}>
            <DelAutocomplete
                bind:input={addDelInput}
                {delegates}
                on:selection={e => addSpeaker(e.detail.label, true)}
            />
        </div>
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