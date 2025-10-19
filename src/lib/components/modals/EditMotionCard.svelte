<!--
  @component Modal card for editing a motion.

  This modal wraps around `MotionForm`.
  Note that this will not update the provided motion object,
  but rather "submit" the changed motion back to the trigger.
-->

<script lang="ts">
    import ModalContent, { type ExitProps } from "$lib/components/modals/ModalContent.svelte";
    import MotionForm from "$lib/components/MotionForm.svelte";
    import { db } from "$lib/db/index.svelte";
    import { inputifyMotion } from "$lib/motions/definitions";
    import type { Motion } from "$lib/types";
    
    interface Props extends ExitProps<Motion> {
        /**
         * The motion data to edit.
         */
        motion: Motion;
    }
    let { motion, open = $bindable(), onSubmit }: Props = $props();

    let inputMotion = $state(inputifyMotion(motion));
    inputifyMotion(motion, db.delegates).then(im => inputMotion = im);
</script>

<ModalContent title="Editing Motion" bind:open {onSubmit}>
    {#snippet main({ submit, close })}
        <MotionForm {submit} bind:inputMotion>
            {#snippet buttons()}
                <div class="flex justify-end gap-3">
                    <button class="btn preset-filled-error-500" type="button" onclick={close}>Cancel</button>
                    <button class="btn preset-filled-primary-500" type="submit">Submit</button>
                </div>
            {/snippet}
        </MotionForm>
    {/snippet}
</ModalContent>