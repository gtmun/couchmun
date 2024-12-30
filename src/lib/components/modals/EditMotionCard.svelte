<script lang="ts">
    import type { Motion } from "$lib/types";
    import MotionForm from "$lib/components/MotionForm.svelte";
    import EditModal from "$lib/components/modals/EditModal.svelte";
    import { db } from "$lib/db";
    import { inputifyMotion } from "$lib/motions/definitions";
    
    interface Props {
        motion: Motion;
    }
    let { motion }: Props = $props();

    let inputMotion = $state(inputifyMotion(motion));
    inputifyMotion(motion, db.delegates).then(im => inputMotion = im);
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