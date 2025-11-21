<script lang="ts">
    import type { Snippet } from "svelte";

    import UniModal from "./UniModal.svelte";

    interface Props {
        open: boolean,
        success: () => void,
        failure?: () => void,
        trigger?: Snippet<[]>,
        content?: Snippet<[]>,
    }
    let {
        open = $bindable(),
        success,
        failure = undefined,
        trigger = undefined,
        content = undefined
    }: Props = $props();
</script>

<UniModal
    title="Confirm"
    type="modal"
    bind:open
    onSubmit={(r: boolean) => r ? success() : failure?.()}
    {trigger}
>
    {#snippet main()}
        {#if content}
            <article class="flex-col items-stretch">
                {@render content?.()}
            </article>
        {/if}
    {/snippet}
    {#snippet footer({ submit })}
        <div>
            <button type="button" class="btn preset-filled-error-500" onclick={() => submit(false)}>Cancel</button>
            <button type="button" class="btn preset-filled-success-500" onclick={() => submit(true)}>Confirm</button>
        </div>
    {/snippet}
</UniModal>