<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import { Autocomplete, type AutocompleteOption } from "@skeletonlabs/skeleton";

    interface Props {
        input: string | undefined;
        delegates: Record<string, DelegateAttrs>;
        presentDelegates: string[];
        maxHeight?: string;
    }

    let {
        input = $bindable(),
        delegates,
        presentDelegates,
        maxHeight = "max-h-96"
    }: Props = $props();

    let options = $derived(
        Array.from(presentDelegates)
            .filter(k => typeof delegates[k] !== "undefined")
            .map((k) => ({
                value: k,
                label: delegates[k].name,
                keywords: delegates[k].aliases.join(",")
            }) satisfies AutocompleteOption<string>)
    );
</script>

<Autocomplete
    class="overflow-y-auto {maxHeight}"
    bind:input
    {options}
    on:selection
/>