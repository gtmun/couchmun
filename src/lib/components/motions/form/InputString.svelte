<script lang="ts">
    import { Combobox, Portal, useListCollection } from "@skeletonlabs/skeleton-svelte";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { includesInsensitive } from "$lib/util";

    interface Props extends InputComponentProps<string> {
        label?: string;
        autocomplete?: string[];
    }
    let {
        name,
        error,
        value = $bindable(),
        label = "Topic",
        isExtending,
        autocomplete = [],
    }: Props = $props();

    let items = $derived(value && !autocomplete.includes(value) ? [...autocomplete, value] : autocomplete);
    let filteredItems = $derived(items.filter(it => !value || includesInsensitive(it, value)));
    const collection = $derived(
        useListCollection({
            items: filteredItems,
            itemToString: (item) => item,
            itemToValue: (item) => item,
        }),
    );
</script>

<label class="label">
    <span>{label}</span>
    {#if autocomplete.length}
        <Combobox
            placeholder="Search..."
            {collection}

            inputValue={value}
            onInputValueChange={e => value = e.inputValue}
            allowCustomValue
        >
            <Combobox.Control>
                <Combobox.Input class={[error && "preset-input-error", "transition-colors"]} />
                <Combobox.Trigger />
            </Combobox.Control>
            <Portal>
                <Combobox.Positioner class="z-51! max-h-96 overflow-auto">
                    <Combobox.Content>
                        {#each filteredItems as item (item)}
                            <Combobox.Item {item}>
                                <Combobox.ItemText>{item}</Combobox.ItemText>
                                <Combobox.ItemIndicator />
                            </Combobox.Item>
                        {/each}
                    </Combobox.Content>
                </Combobox.Positioner>
            </Portal>
        </Combobox>
    {:else}
        <input
            {name}
            class={["input", error && "preset-input-error"]}
            bind:value
            disabled={isExtending}
        />
    {/if}
</label>
