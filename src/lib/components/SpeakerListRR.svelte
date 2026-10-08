<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import type { Delegate } from "$lib/db/delegates";
    import type { DelegateID, Speaker } from "$lib/types";
    import { lazyslide } from "$lib/util";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiCheck from "~icons/mdi/check";

    interface Props {
        comboboxDelegates: Delegate[];
        proposer: Delegate | undefined;
        order: Speaker[];
        speakersList: SpeakerList | undefined;
    }
    let { comboboxDelegates, order = $bindable(), proposer, speakersList }: Props = $props();

    let hideAddAll = $derived.by(() => {
        if (overrideHAA) return true;
        if (order.length == 0) return false;
        return comboboxDelegates.length == 0;
    });
    let overrideHAA = $state(false);

    let hideFirstLast = $derived.by(() => {
        if (overrideHFL) return true;
        if (!proposer) return true;
        if (order.length == 0) return false;
        return order[0].key == proposer.id || order[order.length - 1].key == proposer.id;
    });
    let overrideHFL = $state(false);

    function addAll() {
        if (speakersList) {
            for (let del of comboboxDelegates) {
                speakersList.addSpeaker(del.id);
            }
        }
    }

    function removeDelInOrder(order: Speaker[], proposerId: DelegateID) {
        const orderIdx = order.findIndex(s => s.key === proposerId);
        if (orderIdx >= 0) {
            order.splice(orderIdx, 1);
        }
    }
    function moveProposerFirst() {
        if (speakersList && proposer) {
            removeDelInOrder(order, proposer.id);
            speakersList.addSpeakerFirst(proposer.id);
        }
    }
    function moveProposerLast() {
        if (speakersList && proposer) {
            removeDelInOrder(order, proposer.id);
            speakersList.addSpeakerLast(proposer.id);
        }
    }
</script>

{#if !hideAddAll || !hideFirstLast}
<div
    class="card card-filled p-2 flex flex-col preset-filled-surface-200-800"
    transition:lazyslide
>
    {#if !hideAddAll}
        <div
            class="flex justify-between items-center"
            transition:lazyslide
        >
            <div>Add delegates in roll call order?</div>
            <div class="flex gap-1">
                <div>
                    <button
                        class="btn-icon preset-filled-success-500"
                        onclick={() => addAll()}
                    >
                        <MdiCheck />
                    </button>
                </div>
                <div>
                    <button
                        class="btn-icon preset-filled-error-500"
                        onclick={() => overrideHAA = true}
                    >
                        <MdiCancel />
                    </button>
                </div>
            </div>
        </div>
    {/if}
    {#if !hideAddAll && !hideFirstLast}
        <div class="pt-2" transition:lazyslide></div>
    {/if}
    {#if !hideFirstLast}
        <div
            class="flex justify-between items-center"
            transition:lazyslide
        >
            <DelLabel attrs={proposer?.getAttributes()} inline />
            <div>
                <button
                    class="btn preset-filled-primary-500"
                    onclick={() => moveProposerFirst()}
                >
                    First
                </button>
                <button
                    class="btn preset-filled-primary-500"
                    onclick={() => moveProposerLast()}
                >
                    Last
                </button>
                <button
                    class="btn-icon preset-filled-error-500"
                    onclick={() => overrideHFL = true}
                >
                    <MdiCancel />
                </button>
            </div>
        </div>
    {/if}
</div>
{/if}