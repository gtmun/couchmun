<!--
  @component Modal card for editing (or creating) a delegate.

  This modal consists of a simple form to specify the delegate's attributes.
-->
<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import ModalContent, { type ExitProps } from "$lib/components/modals/ModalContent.svelte";

    type SubmitData = { attrs: DelegateAttrs };
    interface Props extends ExitProps<SubmitData> {
        /**
         * Original properties of the delegate.
         * 
         * If `undefined`, this form will be used to "create" a delegate
         * (rather than "edit" a delegate).
         */
        attrs?: DelegateAttrs
    }

    let { 
        attrs = {
            name: "",
            aliases: []
        },
        open = $bindable(),
        onSubmit,
    }: Props = $props();

    let newAttrs = $state(attrs);
    let aliasesInput = $state(attrs.aliases.join(", "));

    function splitAliasInput(inp: string) {
        inp = inp.trim();
        
        return inp.split(", ")
            .map(s => s.trim())
            .filter(s => s.length !== 0);
    }
    function submitValue(e: SubmitEvent, submit: (t: SubmitData) => void) {
        e.preventDefault();
        newAttrs.aliases = splitAliasInput(aliasesInput);
        submit({ attrs: $state.snapshot(newAttrs) });
    }
</script>

<ModalContent title="Editing {newAttrs.name}" bind:open {onSubmit}>
    {#snippet main({ submit, close })}
        <form class="flex flex-col gap-3" onsubmit={(e) => submitValue(e, submit)}>
            <label>
                <span>Name</span>
                <input class="input" bind:value={newAttrs.name} required placeholder="Modelunia">
            </label>
            <label>
                <span>Aliases (optional)</span>
                <input class="input" bind:value={aliasesInput} placeholder="Republic of Modelunia, Modelunic Republic">
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
</ModalContent>