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
     * The current speaker.
     */
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
        return labels?.[key] ?? key;
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
            selectedSpeaker = undefined;
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
                    on:click={() => selectedSpeaker = speaker}
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