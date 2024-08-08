<script lang="ts">
    import Icon from "@iconify/svelte";
    import { readonly, writable } from "svelte/store";
    import type { Speaker } from "./types";

    /**
     * The order of speakers for the speaker's list.
     */
    export let order: Speaker[] = [];

    /**
     * A mapping of key to label (display text).
     * 
     * If no entry exists for a given key, the speaker's key is displayed.
     */
    export let labels: Record<string, string> = {};

    /**
     * Handler for when the selected item changes.
     */
    export let onSelectChange: (key: string | undefined) => void = () => {};

    // The current selected item.
    let selectedSpeaker: Speaker | undefined = undefined;
    // List item elements per order item
    let liElements = new Map<Speaker, HTMLLIElement>();

    // Readonly values
    let _clStore = writable(false);
    $: $_clStore = order.length === 0;
    export const cleared = readonly(_clStore);

    let _adStore = writable(false);
    $: $_adStore = typeof selectedSpeaker === "undefined" && order.every(({ completed }) => completed);
    export const allDone = readonly(_adStore);

    //
    function getLabel(key: string) {
        return labels?.[key] ?? key;
    }
    function selectSpeaker(speaker: Speaker | undefined) {
        const change = selectedSpeaker !== speaker;
        selectedSpeaker = speaker;
        if (change) onSelectChange(selectedSpeaker?.key);
        
        if (typeof speaker !== "undefined") {
            liElements.get(speaker)?.scrollIntoView({ block: "nearest" });
        }
    }
    function markComplete(speaker: Speaker | undefined) {
        if (typeof speaker !== "undefined") {
            speaker.completed = true;
        }
        selectedSpeaker = selectedSpeaker; // shouldn't rlly be here but this updates speaker
    }
    export function start() {
        markComplete(selectedSpeaker);
    }
    export function next() {
        markComplete(selectedSpeaker);

        // Find first element in the order that has not been completed yet.
        selectSpeaker(order.find(({ completed }) => !completed));
    }
    export function clear() {
        liElements.clear();
        liElements = liElements;
        order = [];
        selectSpeaker(undefined);
    }

    export function addSpeaker(key: string) {
        if (key) {
            order.push({ key, completed: false });
            order = order;
        }
    }
    function deleteSpeaker(i: number) {
        let [removedSpeaker] = order.splice(i, 1);
        order = order;
        
        if (removedSpeaker === selectedSpeaker) {
            selectSpeaker(undefined);
        }
    }

    let bindToMap = <K, V extends HTMLElement>(el: V, [map, key]: [Map<K, V>, K]) => {
        map.set(key, el);
        return { destroy() { map.delete(key); } }
    };
</script>

<div class="card p-4 overflow-y-auto flex-grow">
    <ol class="list grid grid-cols-[auto_1fr_auto]">
        {#each order as speaker, i}
            <li class="!grid grid-cols-subgrid col-span-3" use:bindToMap={[liElements, speaker]}>
                <span>{i + 1}.</span>
                <button 
                    class="btn"
                    class:variant-filled-primary={selectedSpeaker === speaker}
                    class:variant-soft-surface={selectedSpeaker !== speaker && speaker.completed}
                    class:variant-ringed-surface={selectedSpeaker !== speaker && !speaker.completed}
                    class:hover:variant-ringed-primary={selectedSpeaker !== speaker && !speaker.completed}
                    on:click={() => selectSpeaker(speaker)}
                >
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