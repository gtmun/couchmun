<script lang="ts">
    import type { Motion } from "$lib/types";
    import MotionForm from "$lib/components/MotionForm.svelte";
    import EditModal from "$lib/components/modals/EditModal.svelte";
    import { inputifyMotion } from "$lib/motions/definitions";
    import { getSessionDataContext } from "$lib/stores/session";

    const { settings: { delegateAttributes } } = getSessionDataContext();
    
    interface Props {
        motion: Motion;
    }

    let { motion }: Props = $props();
</script>

<EditModal title="Editing Motion">
    {#snippet children({ submit, close })}
        <MotionForm {submit} inputMotion={inputifyMotion(motion, $delegateAttributes)}>
            {#snippet buttons()}
                <div class="flex justify-end gap-3">
                    <button class="btn variant-filled-error" type="button" onclick={close}>Cancel</button>
                    <button class="btn variant-filled-primary" type="submit">Submit</button>
                </div>
            {/snippet}
        </MotionForm>
    {/snippet}
</EditModal>