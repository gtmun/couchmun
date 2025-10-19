<script lang="ts">
    import type { Snippet } from "svelte";

    import ModalContent from "./ModalContent.svelte";

    interface Props {
        open: boolean,
        success: () => void,
        failure?: () => void,
        children?: Snippet<[]>,
    }
    let {
        open = $bindable(),
        success,
        failure = undefined,
        children = undefined
    }: Props = $props();
</script>

<ModalContent title="Confirm" bind:open onSubmit={(r: boolean) => r ? success() : failure?.()}>
    {#snippet main()}
        {@render children?.()}
    {/snippet}
    {#snippet footer({ submit })}
        <div>
            <button type="button" class="btn preset-filled-error-500" onclick={() => submit(false)}>Cancel</button>
            <button type="button" class="btn preset-filled-success-500" onclick={() => submit(true)}>Confirm</button>
        </div>
    {/snippet}
</ModalContent>