<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import EditModal from "./EditModal.svelte";

    interface Props {
        attrs: Record<string, DelegateAttrs>;
    }

    let { attrs }: Props = $props();
    // TODO: Handle attribute update?
    let enabled = $state(Object.fromEntries(Object.keys(attrs).map(k => [k, false])));

    let inputText: string = $state("");

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
                    .find(([_, v]) => matchesKey(line, v));
                if (item) {
                    enabled[item[0]] = true;
                } else {
                    inputText += line
                    inputText += '\n'
                }
            }
        }
    }

    let enabledText = $derived(
        Object.entries(enabled)
        .filter(([_, e]) => e)
        .map(([k, _]) => attrs[k].name ?? k)
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