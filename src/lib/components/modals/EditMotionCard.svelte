<script lang="ts">
    import type { Motion } from "$lib/types";
    import MotionForm from "$lib/components/MotionForm.svelte";
    import EditModal from "$lib/components/modals/EditModal.svelte";
    import { inputifyMotion } from "$lib/motions/definitions";
    import { getSessionDataContext } from "$lib/stores/session";

    const { settings: { delegateAttributes } } = getSessionDataContext();
    
    export let motion: Motion;
</script>

<EditModal title="Editing Motion" let:submit let:close>
    <MotionForm {submit} inputMotion={inputifyMotion(motion, $delegateAttributes)}>
        <svelte:fragment slot="buttons">
            <div class="flex justify-end gap-3">
                <button class="btn variant-filled-error" type="button" on:click={close}>Cancel</button>
                <button class="btn variant-filled-primary" type="submit">Submit</button>
            </div>
        </svelte:fragment>
    </MotionForm>
</EditModal>