<script lang="ts">
    import DelLabel from "#lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "#lib/components/SpeakerList.svelte";
    import type { Delegate } from "#lib/db/delegates.js";
    import type { DelegateID, Speaker } from "#lib/types.d.ts";
    import { a11yLabel, lazyslide } from "#lib/util/index.js";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiCheck from "~icons/mdi/check";
    import MdiNumericOne from "~icons/mdi/numeric-one";
    import MdiSizeL from "~icons/mdi/size-l";

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
            class="flex justify-between items-center gap-2"
            transition:lazyslide
        >
            <div>Add delegates in roll call order?</div>
            <div class="flex gap-1">
                <div>
                    <button
                        class="btn-icon preset-filled-success-500"
                        onclick={() => addAll()}
                        {...a11yLabel("Accept")}
                    >
                        <MdiCheck />
                    </button>
                </div>
                <div>
                    <button
                        class="btn-icon preset-filled-error-500"
                        onclick={() => overrideHAA = true}
                        {...a11yLabel("Deny")}
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
            class="flex justify-between items-center gap-2"
            transition:lazyslide
        >
            <DelLabel attrs={proposer?.getAttributes()} inline />
            <div class="flex gap-1">
                <button
                    class="btn-icon preset-filled-primary-500 p-0.5"
                    onclick={() => moveProposerFirst()}
                    {...a11yLabel("First")}
                >
                    <MdiNumericOne class="size-6" />
                </button>
                <button
                    class="btn-icon preset-filled-primary-500 p-0.5"
                    onclick={() => moveProposerLast()}
                    {...a11yLabel("Last")}
                >
                    <MdiSizeL class="size-6" />
                </button>
                <button
                    class="btn-icon preset-filled-error-500"
                    onclick={() => overrideHFL = true}
                    {...a11yLabel("Do Not Reorder")}
                >
                    <MdiCancel />
                </button>
            </div>
        </div>
    {/if}
</div>
{/if}
