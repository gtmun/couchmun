<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import EditModal from "./EditModal.svelte";

    export let attrs: Record<string, DelegateAttrs>;
    $: enabled = Object.fromEntries(Object.keys(attrs).map(k => [k, false]));

    let inputText: string;

    function exit(submit: (value: any) => void) {
        submit(enabled);
    }

    function matchesKey(name: string, attr: DelegateAttrs) {
        const eq = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) == 0;
        return [attr.name, ...attr.aliases].some(n => eq(n, name));
        
    }
    function keydown(k: KeyboardEvent) {
        if (k.code === "Enter") {
            k.preventDefault();
            
            let text = inputText;
            inputText = "";
            for (let line of text.split("\n")) {
                line = line.trim();
                let item = Object.entries(attrs)
                    .find(([k, v]) => matchesKey(line, v));
                if (item) {
                    enabled[item[0]] = true;
                } else {
                    inputText += line
                    inputText += '\n'
                }
            }
        }
    }

    $: enabledText = Object.entries(enabled)
        .filter(([_, b]) => b)
        .map(([k, _]) => attrs[k].name ?? k)
        .join("\n");
</script>
<EditModal title="Enable/Disable Delegates" let:submit let:close>
    <div class="flex flex-col gap-3">
        Enter all delegates to enable:
        <div class="grid grid-cols-2 gap-3">
            <textarea class="textarea" rows={10} on:keydown={keydown} bind:value={inputText} />
            <textarea class="textarea" rows={10} readonly>{enabledText}</textarea>
        </div>
        <div class="flex justify-end gap-1">
            <button class="btn variant-filled-error" type="button" on:click={close}>Cancel</button>
            <button class="btn variant-filled-primary" type="button" on:click={() => exit(submit)}>Done</button>
        </div>
    </div>
</EditModal>