<!-- 
  @component A combobox input which acts as a delegate selector.
  
  You can use this component in replacement of a standard `<input>`,
  and it will automatically handle autocomplete and delegate functionality.
-->

<script lang="ts">
    import { Combobox, Portal, useListCollection } from "@skeletonlabs/skeleton-svelte";

    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { findDelegate, type Delegate } from "$lib/db/delegates";
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
         * Selects item when unfocused.
         * 
         * If true, then on defocus, this will select whatever is keyboard-hovered
         * when the menu is tabbed out.
         * 
         * By default, this is false.
         */
        selectOnBlur?: boolean,
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
        selectOnBlur = false,
        onSelect
    }: Props = $props();
    
    let presentDelegates = $derived(delegates.filter(d => d.isPresent()));
    let filteredDelegates = $derived(presentDelegates);
    const collection = $derived(useListCollection({
        items: filteredDelegates,
        itemToString: it => it.name,
        itemToValue: it => String(it.id)
    }))

    function onInputValueChange(e: { inputValue: string }) {
        input = e.inputValue;
        filteredDelegates = presentDelegates.filter(d => d.nameIncludes(e.inputValue));
    }
    let delsEmpty = $derived(presentDelegates.length == 0);
    let comboboxValue = $derived(typeof value !== "undefined" ? [String(value)] : []);

    let highlightedValue = $state<string | null>(null);

    function onBlur() {
        if (selectOnBlur && highlightedValue != null) {
            value = +highlightedValue;
            input = findDelegate(delegates, value)?.name;
        }
    }
</script>

<Combobox
    {collection}

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

    placeholder={!delsEmpty ? "Select..." : "No delegates present"}
    disabled={delsEmpty}

    {highlightedValue}
    onHighlightChange={e => highlightedValue = e.highlightedValue}

    onInteractOutside={onBlur}

    {inputBehavior}
    {selectionBehavior}

    class={classes}
>
    <Combobox.Control>
        <Combobox.Input class={[error && "preset-input-error", "transition-colors"]} />
        <Combobox.Trigger />
    </Combobox.Control>
    <Portal>
        <Combobox.Positioner class="z-1!">
            <Combobox.Content>
                {#each collection.group() as [type, items] (type)}
                    <Combobox.ItemGroup>
                        <Combobox.ItemGroupLabel>{type}</Combobox.ItemGroupLabel>
                        {#each items as item (item.id)}
                            <Combobox.Item {item}>
                                <DelLabel attrs={item.getAttributes()} inline />
                            </Combobox.Item>
                        {/each}
                    </Combobox.ItemGroup>
                {/each}
            </Combobox.Content>
        </Combobox.Positioner>
    </Portal>
</Combobox>