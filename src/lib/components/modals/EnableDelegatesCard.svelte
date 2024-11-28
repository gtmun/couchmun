<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import { SvelteSet } from "svelte/reactivity";
    import EditModal from "./EditModal.svelte";

    interface Props {
        attrs: (DelegateAttrs & {id: number})[];
    }

    let { attrs }: Props = $props();
    let enabled = new SvelteSet<number>();
    let inputText: string = $state("");

    function exit(submit: (value: any) => void) {
        submit(enabled);
    }

    function matchesName(name: string, attr: DelegateAttrs) {
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
                let item = attrs.find(d => matchesName(line, d));
                if (item) {
                    enabled.add(item.id);
                } else {
                    inputText += line;
                    inputText += '\n';
                }
            }
        }
    }

    let enabledText = $derived(
        attrs.filter(({id}) => enabled.has(id))
            .map(({name}) => name)
            .join("\n")
    );
</script>
<EditModal title="Enable/Disable Delegates">
    {#snippet children({ submit, close })}
        <div class="flex flex-col gap-3">
            Enter all delegates to enable:
            <div class="grid grid-cols-2 gap-3">
                <textarea class="textarea" rows={10} onkeydown={keydown} bind:value={inputText}></textarea>
                <textarea class="textarea" rows={10} readonly>{enabledText}</textarea>
            </div>
            <div class="flex justify-end gap-1">
                <button class="btn variant-filled-error" type="button" onclick={close}>Cancel</button>
                <button class="btn variant-filled-primary" type="button" onclick={() => exit(submit)}>Done</button>
            </div>
        </div>
    {/snippet}
</EditModal>