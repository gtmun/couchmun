<script lang="ts">
    import type { DelegateAttrs } from "$lib/dashboard/types";
    import { getModalStore } from "@skeletonlabs/skeleton";

    export let key: string;
    export let attrs: DelegateAttrs;

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

<div class="card p-4">
    <h2 class="h2 p-4">Editing {attrs.name}</h2>
    <form class="flex flex-col gap-3" on:submit|preventDefault={submitData}>
        <label>
            <span>Key</span>
            <input class="input" bind:value={key}>
        </label>
        <label>
            <span>Name</span>
            <input class="input" bind:value={attrs.name}>
        </label>
        <label>
            <span>Aliases</span>
            <input class="input" bind:value={aliasesInput}>
        </label>
        <div class="flex justify-end gap-3">
            <button class="btn variant-filled-error" type="button" on:click={modalStore.close}>Cancel</button>
            <button class="btn variant-filled-primary" type="submit">Submit</button>
        </div>
    </form>
</div>