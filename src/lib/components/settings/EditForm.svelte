<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import { getModalStore } from "@skeletonlabs/skeleton";

    export let key: string | undefined = undefined;
    export let attrs: DelegateAttrs = {
        name: "",
        aliases: []
    };

    let aliasesInput = attrs.aliases.join(", ");
    const modalStore = getModalStore();

    function splitAliasInput(inp: string) {
        inp = inp.trim();
        
        return inp.split(", ")
            .map(s => s.trim())
            .filter(s => s.length !== 0);
    }
    function submitData() {
        attrs.aliases = splitAliasInput(aliasesInput);
        $modalStore[0].response?.({ key, attrs });
        modalStore.close();
    }
</script>

<div class="card p-4 w-1/2">
    <h2 class="h2 p-4">Editing {attrs.name}</h2>
    <form class="flex flex-col gap-3" on:submit|preventDefault={submitData}>
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
            <button class="btn variant-filled-error" type="button" on:click={modalStore.close}>Cancel</button>
            <button class="btn variant-filled-primary" type="submit">Submit</button>
        </div>
    </form>
</div>