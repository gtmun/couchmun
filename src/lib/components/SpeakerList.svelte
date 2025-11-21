<!--
  @component This component displays a list of speakers during a caucus,
  as well as providing a default method ot adding new speakers.

  This component handles the ability to select, delete, 
  and rearrange speakers in the speakers list.
 -->
<script lang="ts">
    import { Dialog } from "@skeletonlabs/skeleton-svelte";
    import { tick, untrack, type Snippet } from "svelte";
    import { flip } from "svelte/animate";
    import { dragHandle, dragHandleZone } from "svelte-dnd-action";


    import DelCombobox from "$lib/components/controls/DelCombobox.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import ConfirmModal from "$lib/components/modals/ConfirmModal.svelte";
    import { type Delegate, findDelegate } from "$lib/db/delegates";
    import type { DelegateID, Speaker, SpeakerEntryID } from "$lib/types";
    import { isDndShadow } from "$lib/util/dnd";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiDelete from "~icons/mdi/delete";
    import MdiDragVertical from "~icons/mdi/drag-vertical";

    
    interface Props {
        /**
         * The order of speakers for the speakers list.
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
         * Controls placed above the add speakers control.
         * 
         * If `controls` is defined, neither this nor the default add speakers control
         * will appear.
         */
        subcontrols?: Snippet;
        /**
         * The title of the component, which appears at the top. 
         * 
         * By default, this "Speakers List"
         */
        title?: Snippet | string;
        /**
         * If this prop is defined, the function callback is activated right before a speaker changes.
         */
        onBeforeSpeakerUpdate?: ((oldSpeaker: Speaker | undefined, newSpeaker: Speaker | undefined) => void);
        /**
         * If this prop is defined, the function callback is activated when a speaker is marked as completed.
         */
        onMarkComplete?: ((key: DelegateID, isRepeat: boolean) => unknown);
    }

    let {
        order = $bindable([]),
        delegates = [],
        controls = undefined,
        subcontrols = undefined,
        title = "Speakers List",
        onBeforeSpeakerUpdate = undefined,
        onMarkComplete = undefined
    }: Props = $props();
    const sid = $props.id();

    // A clone of order used solely for use:dragHandleZone
    let dndItems = $derived(order);

    // The UUID of the currently selected speaker object:
    let selectedSpeakerId = $state<SpeakerEntryID>();
    // A mapping from IDs to Speakers:
    let orderMap = $derived(new Map(
        order.filter(s => typeof s.id === "string" && s.id)
            .map((speaker) => [speaker.id, speaker])
    ));
    // Point to insert speakers (by number of elements from the end).
    let insertPoint = $state(0);

    // List item elements per order item
    let listEl = $state<HTMLOListElement>();
    function jumpToSpeaker(speakerId?: string) {
        if (!listEl) return;

        let delta;
        if (typeof speakerId === "string") {
            let index = order.findLastIndex(s => s.id == speakerId);
            let li = listEl.children[index] as HTMLElement | undefined;
            if (!li) return;
            delta = li.offsetTop - listEl.offsetTop;
        } else {
            delta = listEl.scrollHeight;
        }

        listEl.scrollTo({
            top: delta,
            left: 0,
            behavior: "smooth"
        });
    }

    let openModals = $state({
        clearSpeakers: false
    });

    /**
     * Whether the speakers list is complete (there are no other speakers left in the list).
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
        return orderMap.get(speakerId);
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
     * Starts the speakers list.
     */
    export function start() {
        markComplete(selectedSpeakerId);
    }
    /**
     * Moves to the next speaker in the speakers list.
     */
    export function next() {
        markComplete(selectedSpeakerId);

        // Find first element in the order that has not been completed yet.
        setSelectedSpeaker(order.find(({ completed }) => !completed))
            .then(tick)
            .then(() => jumpToSpeaker(selectedSpeakerId)); // Scroll new speaker to view
    }

    /**
     * Adds a speaker to the speakers list.
     * @param key The key of the speaker
     * @returns if key exists (asserting adding succeeds)
     */
    export function addSpeaker(key: number): boolean {
        if (!delegates.some(k => k.id === key)) return false;

        // Successful, so add speakers:
        let speaker = createSpeaker(key);
        if (insertPoint == 0) {
            order.push(speaker);
        } else {
            order.splice(-insertPoint, 0, speaker);
        }
        order = order;

        // Jump to this speaker when DOM updates.
        // HACK: this is waiting for 2 frames, which is usually enough for the dom to update
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    jumpToSpeaker();
                })
            });
        });

        return true;
    }

    export function addSpeakerFirst(key: number): boolean {
        if (!delegates.some(k => k.id === key)) return false;

        // Successful, so add speakers:
        let speaker = createSpeaker(key);
        order.unshift(speaker);
        order = order;

        return true;
    }
    export function addSpeakerLast(key: number): boolean {
        if (!delegates.some(k => k.id === key)) return false;

        // Successful, so add speakers:
        let speaker = createSpeaker(key);
        order.push(speaker);
        order = order;
        insertPoint++;

        return true;
    }

    // DEFAULT CONTROLS
    /**
     * Deletes the speaker at index i in the speakers list.
     * @param i The index.
     */
    function deleteSpeaker(i: number) {
        if (i >= order.length - insertPoint) {
            insertPoint--;
        }

        let [removedSpeaker] = order.splice(i, 1);
        order = order;
        
        if (removedSpeaker?.id === selectedSpeakerId) {
            setSelectedSpeaker(undefined);
        }
    }

    /**
     * Sets the selected speaker and activates the "onBeforeSpeakerUpdate" listener.
     * 
     * In order to properly trigger `onBeforeSpeakerUpdate`, this method should be used,
     * and not `selectedSpeakerId = newId`.
     * 
     * @param speaker the speaker object (or undefined to clear speaker)
     */
    async function setSelectedSpeaker(speaker: Speaker | undefined) {
        if (selectedSpeakerId !== speaker?.id) {
            let currentSpeaker = findSpeaker(selectedSpeakerId);
            let nextSpeaker = findSpeaker(speaker?.id);

            // Call beforeSpeakerUpdate (and let it run to completion if is Promise) before setting speaker.
            return Promise.resolve(onBeforeSpeakerUpdate?.(currentSpeaker, nextSpeaker))
                .finally(() => selectedSpeakerId = nextSpeaker?.id);
        }
    }
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

<div class="card-filled p-4 overflow-y-hidden grow flex flex-col items-stretch gap-4 min-w-90">
    <h4 class="h4 flex justify-center" id="sl-header-{sid}">
        {#if typeof title === "string"}
            {title}
        {:else}
            {@render title?.()}
        {/if}
    </h4>

    <ol class="p-2 overflow-y-auto grid grid-cols-[auto_auto_1fr_auto] auto-rows-min grow"
        bind:this={listEl}
        use:dragHandleZone={{
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
        onconsider={(e) => dndItems = e.detail.items}
        onfinalize={(e) => {
            // If any of the end speakers are moved,
            // then wipe the end list.
            if (insertPoint > 0) {
                const original = order.slice(-insertPoint);
                const dragged = e.detail.items.slice(-insertPoint);

                if (!original.every((k, i) => k.id == dragged[i].id)) {
                    insertPoint = 0;
                }
            }
            order = dndItems = e.detail.items;
        }}
        aria-labelledby="sl-header-{sid}"
    >
        {#each dndItems as speaker, i (speaker.id)}
            {@const selected = speaker.id === selectedSpeakerId}
            {@const shadow = isDndShadow(speaker)}
            {@const delAttrs = findDelegate(delegates, speaker.key)}
            {@const speakerLabel = delAttrs?.name ?? "unknown"}

            <li
                class={[
                    "grid! grid-cols-subgrid col-span-4 dnd-list-item items-center gap-3 p-1",
                    shadow && "visible! bg-surface-100-900! rounded",
                    insertPoint > 0 && (i == order.length - insertPoint) && "border-t-2 border-surface-500"
                ]}
                animate:flip={{ duration: 150 }}
                aria-label={speakerLabel}
            >
                <div use:dragHandle>
                    <MdiDragVertical />
                </div>
                <span class="enumerated-index tabular-nums">{i + 1}.</span>
                <button 
                    class={[
                        "btn text-wrap! justify-start overflow-hidden",
                        selected
                            ? 'preset-ui-activated'
                            : speaker.completed
                                ? 'preset-ui-depressed'
                                : 'preset-ui-ready'
                    ]}
                    onclick={() => setSelectedSpeaker(speaker)}
                    title="Select {speakerLabel}"
                    aria-label="Select {speakerLabel}"
                    aria-pressed={selected}
                >
                    <DelLabel attrs={delAttrs} fallbackName={speakerLabel} inline />
                </button>
                <button 
                    class={[
                        "btn-icon-std transition",
                        speaker.completed ? "preset-ui-depressed" : "preset-filled-error-100-900 hover:preset-filled-error-500"
                    ]}
                    onclick={() => deleteSpeaker(i)}
                    title="Delete {speakerLabel}"
                    aria-label="Delete {speakerLabel}"
                    disabled={speaker.completed}
                >
                    <MdiCancel />
                </button>
            </li>
        {/each}
    </ol>

    {#if controls}
        {@render controls()}
    {:else}
        <div class="flex flex-col items-stretch gap-1">
            {@render subcontrols?.()}
            <div class="flex flex-row gap-1 items-center">
                <!-- Delegate combobox -->
                <DelCombobox
                    {delegates}
                    selectionBehavior="clear"
                    class="grow"
                    forgetSelected
                    onSelect={addSpeaker}
                />
                <!-- Clear order -->
                <ConfirmModal
                    bind:open={openModals.clearSpeakers}
                    success={() => order = []}
                >
                    {#snippet trigger()}
                        <Dialog.Trigger
                            class="btn-icon-std preset-filled-primary-500"
                            disabled={order.length === 0}
                            aria-label="Clear Speakers List"
                        >
                            <MdiDelete />
                        </Dialog.Trigger>
                    {/snippet}
                    {#snippet content()}
                        Are you sure you want to clear the Speakers List?
                    {/snippet}
                </ConfirmModal>
            </div>
        </div>
    {/if}
</div>

<style>
    @reference "$lib/../app.css";
    
    /* Styling for dragged element */
    :global(#dnd-action-dragged-el).dnd-list-item {
        background-color: var(--color-surface-50) !important;
        opacity: 90% !important;
        @apply border-2! border-surface-950-50!;

        display: grid !important;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: calc(var(--spacing) * 3);
        padding: calc(var(--spacing) * 1);

        @variant dark {
            background-color: var(--color-surface-950) !important;
        }
    }
</style>