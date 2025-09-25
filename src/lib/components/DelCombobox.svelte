<!-- 
  @component A combobox input which acts as a delegate selector.
  
  You can use this component in replacement of a standard `<input>`,
  and it will automatically handle autocomplete and delegate functionality.
-->

<script lang="ts">
    import type { Delegate } from "$lib/db/delegates";
    import { Combobox } from "@skeletonlabs/skeleton-svelte";
    import DelLabel from "./del-label/DelLabel.svelte";
    import type { DelegateID } from "$lib/types";

    interface Props {
        /**
         * Bindable property representing the input text which the autocomplete tries to complete.
         */
        input?: string;
        /**
         * Bindable property representing where to place the value after selection.
         */
        value?: DelegateID;
        /**
         * List of delegates. The autocomplete will automatically filter out non-present delegates.
         */
        delegates: Delegate[];
        /**
         * Whether the input has an error.
         */
        error?: boolean;

        /**
         * Classes to apply to top of combobox.
         */
        class?: string;

        /**
         * Autocompletion behavior of combobox.
         */
        inputBehavior?: "autohighlight" | "autocomplete" | "none",
        /**
         * What happens to the input after a value has been selected.
         */
        selectionBehavior?: "clear" | "replace" | "preserve",
        /**
         * This prop determines what happens to the selected item after the combobox is interacted with again.
         * 
         * If false (default), the selected value is preserved and highlighted on second interaction. 
         *     It cannot be reselected until it has been deselected.
         * If true, the selected value is not kept, not highlighted, and can be reselected on second interaction.
         */
        forgetSelected?: boolean,
        /**
         * Action to perform when a delegate has been selected.
         * This is done after the value property is set (if that is used).
         */
        onSelect?: (item: DelegateID) => void,
    }

    let {
        input = $bindable(),
        value = $bindable(),
        error = false,
        delegates,
        class: classes = "",
        selectionBehavior,
        inputBehavior = "autohighlight",
        forgetSelected = false,
        onSelect
    }: Props = $props();
    
    let options = $derived(
        delegates
            .filter(d => d.isPresent())
            .map(d => ({
                value: String(d.id),
                label: d.name,
                delegate: d,
            }))
    );
    let data = $derived(options);

    function onInputValueChange(e: { inputValue: string }) {
        input = e.inputValue;
        data = options.filter(o => o.delegate.nameIncludes(e.inputValue))
    }
    let delsEmpty = $derived(options.length == 0);
    let comboboxValue = $derived(typeof value !== "undefined" ? [String(value)] : []);
</script>

<Combobox
    {data}
    inputValue={input ?? ""}
    {onInputValueChange}
    value={comboboxValue}
    onValueChange={e => {
        let newValue = +e.value[0];
        if (!forgetSelected) {
            value = newValue;
        }
        onSelect?.(newValue);
    }}
    disabled={delsEmpty}
    placeholder={!delsEmpty ? "Select..." : "No delegates present"}
    optionHover='hover:preset-tonal hover:brightness-100!'
    inputGroupClasses="{error ? 'preset-input-error' : ''} transition-colors"
    {classes}
    contentClasses="max-h-48 overflow-auto"
    {inputBehavior}
    {selectionBehavior}
>
    {#snippet item(item)}
        <DelLabel attrs={item.delegate.getAttributes()} inline />
    {/snippet}
</Combobox>