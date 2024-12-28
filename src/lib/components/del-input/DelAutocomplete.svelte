<script lang="ts">
    import type { Delegate } from "$lib/db/delegates";
    import { Autocomplete, type AutocompleteOption } from "@skeletonlabs/skeleton";

    interface Props {
        input: string | undefined;
        delegates: Delegate[];
        maxHeight?: string;
    }

    let {
        input = $bindable(),
        delegates,
        maxHeight = "max-h-96"
    }: Props = $props();

    let options = $derived(
        delegates
            .filter(d => d.isPresent())
            .map(d => ({
                value: d.id,
                label: d.name,
                keywords: d.aliases.join(",")
            }) satisfies AutocompleteOption<number>)
    );
</script>

<Autocomplete
    class="overflow-y-auto {maxHeight}"
    bind:input
    {options}
    on:selection
/>