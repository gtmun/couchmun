<!--
  @component Modal card for mass configuring which delegates are "enabled" (in the settings page).

  This modal's content consists of a textbox where delegate names can be pasted,
  synthesizing a list of names that will be enabled.

  On submission, this modal exports the list of enabled IDs.
  This list of enabled IDs is used as the list of "enabled" delegates 
  (all previously "enabled" delegates not on this list will be disabled).
-->


<script lang="ts">
    import { SvelteSet } from "svelte/reactivity";
    import EditModal from "./EditModal.svelte";
    import type { Delegate } from "$lib/db/delegates";

    interface Props {
        /**
         * List of delegates.
         */
        attrs: Delegate[];
    }

    let { attrs }: Props = $props();
    let enabled = new SvelteSet<number>();
    let inputText: string = $state("");

    function keydown(k: KeyboardEvent) {
        if (k.code === "Enter") {
            k.preventDefault();
            
            let text = inputText;
            inputText = "";
            for (let line of text.split("\n")) {
                line = line.trim();
                let item = attrs.find(d => d.nameEquals(line));
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
                <button class="btn variant-filled-primary" type="button" onclick={() => submit(enabled)}>Done</button>
            </div>
        </div>
    {/snippet}
</EditModal>