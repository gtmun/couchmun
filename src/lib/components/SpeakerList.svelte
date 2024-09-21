<script lang="ts">
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
    import { formatValidationError, nonEmptyString } from "$lib/motions/form_validation";
    import type { DelegateAttrs, Speaker } from "$lib/types";
    
    import { readonly, writable } from "svelte/store";
    import type { z } from "zod";
    import Icon from "@iconify/svelte";
    import { popup } from "@skeletonlabs/skeleton";
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import { sortable } from "$lib/util";

    /**
     * The order of speakers for the speaker's list.
     */
    export let order: Speaker[] = [];

    /**
     * A mapping of key to their delegate attributes.
     * 
     * If no entry exists for a given key, the speaker's key is displayed.
     */
    export let delegates: Record<string, DelegateAttrs> = {};

    /**
     * If defined, this creates control options to allow for adding
     * and removing speakers from the speakers' list.
     * 
     * This doesn't need to be defined if:
     * 1. Adding delegates isn't required, or
     * 2. A custom control is implemented instead
     */
    export let useDefaultControls: {
        presentDelegates: string[],
        validator: z.ZodType<string, any, any> | ((dels: Record<string, DelegateAttrs>, presentDels: string[]) => z.ZodType<string, any, any>),
        popupID?: string
    } | undefined = undefined;
    // Properties which are only used with default controls:
    $: validator = typeof useDefaultControls?.validator === "function" 
        ? useDefaultControls?.validator(delegates, useDefaultControls.presentDelegates)
        : useDefaultControls?.validator ?? nonEmptyString();
    let dfltControlsInput: string;
    let dfltControlsError: string | undefined = undefined;

    /**
     * The current speaker.
     */
    let selectedSpeaker: Speaker | undefined = undefined;

    // List item elements per order item
    let liElements = new Map<Speaker, HTMLLIElement>();

    // Readonly values
    let _adStore = writable(false);
    $: $_adStore = typeof selectedSpeaker === "undefined" && order.every(({ completed }) => completed);
    export const allDone = readonly(_adStore);

    let _spStore = writable<string | undefined>(undefined);
    $: $_spStore = selectedSpeaker?.key;
    const _selectedSpeaker = readonly(_spStore);
    export { _selectedSpeaker as selectedSpeaker };

    // If order updates and selectedSpeaker isn't in there, then clear selectedSpeaker:
    $: if (typeof selectedSpeaker !== "undefined" && !order.includes(selectedSpeaker)) {
        selectedSpeaker = undefined;
    }
    // Scroll to speaker if it is out of view:
    $: if (typeof selectedSpeaker !== "undefined") {
        liElements.get(selectedSpeaker)?.scrollIntoView({ block: "nearest" });
    }

    //
    function getLabel(key: string) {
        return delegates?.[key]?.name ?? key;
    }
    function markComplete(speaker: Speaker | undefined) {
        if (typeof speaker !== "undefined") {
            speaker.completed = true;
        }
        order = order;
    }
    export function start() {
        markComplete(selectedSpeaker);
    }
    export function next() {
        markComplete(selectedSpeaker);

        // Find first element in the order that has not been completed yet.
        selectedSpeaker = order.find(({ completed }) => !completed);
    }

    export function addSpeaker(name: string, clearControlInput: boolean = false) {
        const result = validator.safeParse(name);
        if (result.success) {
            const key = result.data;
            // Successful, so add speakers:
            order.push({ key, completed: false });
            order = order;

            if (typeof useDefaultControls !== "undefined") {
                dfltControlsError = undefined;
                // Clear the control input if it exists and it was requested to be cleared.
                if (clearControlInput) dfltControlsInput = "";
            }
        } else {
            dfltControlsError = formatValidationError(result.error).message;
        }
    }
    function deleteSpeaker(i: number) {
        let [removedSpeaker] = order.splice(i, 1);
        order = order;
        
        if (removedSpeaker === selectedSpeaker) {
            selectedSpeaker = undefined;
        }
    }

    const bindToMap = <K, V extends HTMLElement>(el: V, [map, key]: [Map<K, V>, K]) => {
        map.set(key, el);
        return { destroy() { map.delete(key); } }
    };
</script>

<div class="card p-4 overflow-y-auto flex-grow">
    <ol class="list grid grid-cols-[auto_auto_1fr_auto]" use:sortable={{
        animation: 150,
        swapThreshold: 0.9,
        ghostClass: "!bg-surface-400/25",
        dragClass: "!bg-surface-50",
        handle: ".handle",
        fallbackOnBody: true,
        store: {
            get: () => Object.keys(Array.from({ length: order.length })),
            set: (sortable) => order = sortable.toArray().map(k => order[+k])
        }
    }}>
        {#each order as speaker, i (speaker)}
            {@const flagURL = getFlagUrl(speaker.key)}
            {@const speakerLabel = getLabel(speaker.key)}

            <li class="!grid grid-cols-subgrid col-span-4" use:bindToMap={[liElements, speaker]} data-id={i}>
                <div class="btn-icon handle cursor-grab">
                    <Icon icon="mdi:drag-vertical" width="24" height="24" />
                </div>
                <span>{i + 1}.</span>
                <button 
                    class="btn flex items-center gap-1"
                    class:variant-filled-primary={selectedSpeaker === speaker}
                    class:variant-soft-surface={selectedSpeaker !== speaker && speaker.completed}
                    class:variant-ringed-surface={selectedSpeaker !== speaker && !speaker.completed}
                    class:hover:variant-ringed-primary={selectedSpeaker !== speaker && !speaker.completed}
                    on:click={() => selectedSpeaker = speaker}
                >
                    {#if flagURL}
                        <img class="h-4" src={flagURL.toString()} alt="Flag of {speakerLabel}">
                    {/if}
                    {getLabel(speaker.key)}
                </button>
                <div class="btn-icon">
                    {#if !speaker.completed}
                        <button 
                            class="btn-icon variant-soft-surface hover:variant-filled-error" 
                            on:click={() => deleteSpeaker(i)}
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
            <form class="contents" on:submit|preventDefault={() => addSpeaker(dfltControlsInput ?? "", true)} on:input={() => dfltControlsError = undefined}>
                <input 
                    class="input" 
                    class:input-error={error}
                    bind:value={dfltControlsInput}
                    use:popup={{ ...defaultPopupSettings(popupID), placement: "left-end", event: "focus-blur" }}
                    {...defaultPlaceholder(useDefaultControls.presentDelegates.length === 0)}
                />
                <button
                    type="submit"
                    class="btn variant-filled-primary"
                    disabled={useDefaultControls.presentDelegates.length === 0}
                >Add</button>
            </form>
            <!-- Clear order -->
            <button
                type="submit"
                class="btn variant-filled-primary"
                disabled={order.length === 0}
                on:click={() => order = []}
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