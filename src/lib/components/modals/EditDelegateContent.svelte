<!--
  @component Modal card for editing (or creating) a delegate.

  This modal consists of a simple form to specify the delegate's attributes.
-->
<script lang="ts">
    import UniModalContent, { type ExitState } from "./UniModalContent.svelte";

    import type { DelegateAttrs } from "$lib/types";

    type SubmitData = { attrs: DelegateAttrs };
    interface Props {
        /**
         * Original properties of the delegate.
         */
        attrs: DelegateAttrs,

        /**
         * Callers to pass to content.
         */
        exitState: ExitState<SubmitData>,
    }

    let { 
        attrs,
        exitState
    }: Props = $props();

    let newAttrs = $derived(attrs);

    function joinAliasInput(aliases: string[]) {
        return aliases.join(", ");
    }
    function splitAliasInput(inp: string) {
        return inp.split(",")
            .map(s => s.trim())
            .filter(s => s.length !== 0);
    }

    function submitValue(e: SubmitEvent, submit: (t: SubmitData) => void) {
        e.preventDefault();
        submit({ attrs: $state.snapshot(newAttrs) });
    }
</script>

<UniModalContent title="Editing {newAttrs.name}" {exitState}>
    {#snippet main({ submit, close })}
        <form class="flex flex-col gap-3" onsubmit={(e) => submitValue(e, submit)}>
            <label>
                <span>Name</span>
                <input class="input" bind:value={newAttrs.name} required placeholder="Modelunia">
            </label>
            <label>
                <span>Aliases (optional)</span>
                <input class="input" bind:value={
                    () => joinAliasInput(newAttrs.aliases),
                    v => newAttrs.aliases = splitAliasInput(v)
                } placeholder="Republic of Modelunia, Modelunic Republic">
            </label>
            <label>
                <span>Flag URL (optional)</span>
                <input class="input" bind:value={newAttrs.flagURL} placeholder="https://example.com/flag.svg">
            </label>
            <div class="flex justify-end gap-3">
                <button class="btn preset-filled-error-500" type="button" onclick={close}>Cancel</button>
                <button class="btn preset-filled-primary-500" type="submit">Submit</button>
            </div>
        </form>
    {/snippet}
</UniModalContent>