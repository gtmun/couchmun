<!-- 
  @component A combobox input which acts as a delegate selector.
  
  You can use this component in replacement of a standard `<input>`,
  and it will automatically handle autocomplete and delegate functionality.
-->

<script lang="ts">
    import type { Delegate } from "$lib/db/delegates";
    import { Combobox } from "@skeletonlabs/skeleton-svelte";
    import DelLabel from "./del-label/DelLabel.svelte";

    interface Props {
        /**
         * Bindable property representing the input text which the autocomplete tries to complete.
         */
        input: string | undefined;
        /**
         * List of delegates. The autocomplete will automatically filter out non-present delegates.
         */
        delegates: Delegate[];
        /**
         * Whether the input has an error.
         */
        error?: boolean;
    }

    let {
        input = $bindable(),
        error = false,
        delegates
    }: Props = $props();
    
    let data = $derived(
        delegates
            .filter(d => d.isPresent())
            .map(d => ({
                value: String(d.id),
                label: d.name,
                flag: d.flagURL,
                // TODO: support keywords
                keywords: d.aliases.join(",")
            }))
    );

    let delsEmpty = $derived(data.length == 0);
    let state = $state<string[]>(["2"]);
</script>

<!-- TODO: keyword support -->
<!-- TODO: fix the weird scroll thru everything issue -->
<!-- TODO: Reconnect back to input -->
<Combobox
    {data}
    value={state}
    onValueChange={e => state = e.value}
    disabled={delsEmpty}
    placeholder={!delsEmpty ? "Select..." : "No delegates present"}
    inputBehavior="autohighlight"
    inputGroupClasses="{error ? 'preset-input-error' : ''} transition-colors"
>
    {#snippet item(item)}
        <DelLabel attrs={{ name: item.label, flagURL: item.flag }} inline />
    {/snippet}
</Combobox>