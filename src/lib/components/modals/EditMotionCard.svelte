<script lang="ts">
    import type { Motion } from "$lib/types";
    import MotionForm from "$lib/components/MotionForm.svelte";
    import EditModal from "$lib/components/modals/EditModal.svelte";
    import { db } from "$lib/db";
    import { enabledDelegatesStore } from "$lib/db/del";
    import { inputifyMotion } from "$lib/motions/definitions";
    import { untrack } from "svelte";

    const delegates = enabledDelegatesStore(db.delegates);
    
    interface Props {
        motion: Motion;
    }

    let { motion }: Props = $props();
    let inputMotion = $state(inputifyMotion(motion, []));

    // `delegates` doesn't exist at first, so wait before populating the delegate field
    let done = false;
    $effect(() => {
        if ($delegates.length > 0 && !done) untrack(() => {
            inputMotion = inputifyMotion(motion, $delegates);
            done = true;
        })
    })
</script>

<EditModal title="Editing Motion">
    {#snippet children({ submit, close })}
        <MotionForm {submit} bind:inputMotion>
            {#snippet buttons()}
                <div class="flex justify-end gap-3">
                    <button class="btn variant-filled-error" type="button" onclick={close}>Cancel</button>
                    <button class="btn variant-filled-primary" type="submit">Submit</button>
                </div>
            {/snippet}
        </MotionForm>
    {/snippet}
</EditModal>