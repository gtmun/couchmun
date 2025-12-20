<!--
  @component Modal card for editing a motion.

  This modal wraps around `MotionForm`.
  Note that this will not update the provided motion object,
  but rather "submit" the changed motion back to the trigger.
-->

<script lang="ts">
    import UniModalContent, { type ExitState } from "./UniModalContent.svelte";

    import MotionForm from "$lib/components/motions/form/MotionForm.svelte";
    import { type MotionSchema } from "$lib/motions/definitions";
    import type { Motion } from "$lib/types";
    
    interface Props {
        /**
         * The motion data to edit.
         */
        motion: Motion;
        /**
         * The motion validation schema.
         */
        motionSchema: MotionSchema;

        /**
         * Callers to pass to content.
         */
        exitState: ExitState<Motion>;
    }
    let {
        motion,
        motionSchema,
        exitState
    }: Props = $props();


    let inputMotion = $derived(motionSchema.safeEncode(motion)?.data);
</script>

<UniModalContent title="Editing Motion" {exitState}>
    {#snippet main({ submit, close })}
        <MotionForm {submit} {motionSchema} initialInput={inputMotion}>
            {#snippet buttons()}
                <div class="flex justify-end gap-3">
                    <button class="btn preset-filled-error-500" type="button" onclick={close}>Cancel</button>
                    <button class="btn preset-filled-primary-500" type="submit">Submit</button>
                </div>
            {/snippet}
        </MotionForm>
    {/snippet}
</UniModalContent>