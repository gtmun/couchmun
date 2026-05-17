<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { findDelegate, type Delegate } from "$lib/db/delegates";
    import type { DelegateID, Speaker } from "$lib/types";
    import { lazyslide } from "$lib/util";

    interface Props {
        delegates: Delegate[];
        order: Speaker[];
        proposer: DelegateID;
        speakersList: SpeakerList | undefined;
    }
    let { delegates, order, proposer, speakersList }: Props = $props();
</script>

{#if !order.some((s) => s.key == proposer)}
    <div
        class="card card-filled p-2 flex justify-between items-center preset-filled-surface-200-800"
        transition:lazyslide
    >
        <DelLabel attrs={findDelegate(delegates, proposer)} inline />
        <div>
            <button
                class="btn preset-filled-primary-500"
                onclick={() => speakersList?.addSpeakerFirst(proposer)}
            >
                First
            </button>
            <button
                class="btn preset-filled-primary-500"
                onclick={() => speakersList?.addSpeakerLast(proposer)}
            >
                Last
            </button>
        </div>
    </div>
{/if}
