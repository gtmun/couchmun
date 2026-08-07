<script lang="ts">
    import { Dialog } from "@skeletonlabs/skeleton-svelte";

    import DelCombobox from "$lib/components/controls/DelCombobox.svelte";
    import ConfirmModal from "$lib/components/modals/ConfirmModal.svelte";
    import { Delegate } from "$lib/db/delegates";
    import type { DelegateID, Speaker } from "$lib/types";
    import { a11yLabel } from "$lib/util";
    import MdiDelete from "~icons/mdi/delete";

    interface Props {
        delegates: Delegate[],
        order: Speaker[],
        /**
         * When a delegate is selected in the combobox,
         * this callback is called.
         */
        onSelect?(key: DelegateID): void;
    }

    let { delegates, order, onSelect }: Props = $props();
    let openClearSpeakers = $state(false);
</script>
<div class="flex flex-row gap-1 items-center">
    <!-- Delegate combobox -->
    <DelCombobox
        delegates={delegates}
        selectionBehavior="clear"
        class="grow"
        forgetSelected
        {onSelect}
    />
    <!-- Clear order -->
    <ConfirmModal
        bind:open={openClearSpeakers}
        success={() => order = []}
    >
        {#snippet trigger()}
            <Dialog.Trigger
                class="btn-icon preset-filled-error-500"
                disabled={order.length === 0}
                {...a11yLabel("Clear Speakers List")}
            >
                <MdiDelete />
            </Dialog.Trigger>
        {/snippet}
        {#snippet content()}
            Are you sure you want to clear the Speakers List?
        {/snippet}
    </ConfirmModal>
</div>