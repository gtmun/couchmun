<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import EditModal from "$lib/components/modals/EditModal.svelte";

    export let key: string | undefined = undefined;
    export let attrs: DelegateAttrs = {
        name: "",
        aliases: []
    };

    let aliasesInput = attrs.aliases.join(", ");

    function splitAliasInput(inp: string) {
        inp = inp.trim();
        
        return inp.split(", ")
            .map(s => s.trim())
            .filter(s => s.length !== 0);
    }
    function submitValue(submit: (t: any) => void) {
        attrs.aliases = splitAliasInput(aliasesInput);
        submit({ key, attrs });
    }
</script>

<EditModal title="Editing {attrs.name}" let:submit let:close>
    <form class="flex flex-col gap-3" on:submit|preventDefault={() => submitValue(submit)}>
        <label>
            <span>Key</span>
            <input class="input" bind:value={key} required placeholder="XM">
        </label>
        <label>
            <span>Name</span>
            <input class="input" bind:value={attrs.name} required placeholder="Modelunia">
        </label>
        <label>
            <span>Aliases (optional)</span>
            <input class="input" bind:value={aliasesInput} placeholder="Republic of Modelunia, Modelunic Republic">
        </label>
        <div class="flex justify-end gap-3">
            <button class="btn variant-filled-error" type="button" on:click={close}>Cancel</button>
            <button class="btn variant-filled-primary" type="submit">Submit</button>
        </div>
    </form>
</EditModal>