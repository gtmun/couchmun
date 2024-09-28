<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import { Autocomplete, type AutocompleteOption } from "@skeletonlabs/skeleton";

    export let input: string | undefined;
    export let delegates: Record<string, DelegateAttrs>;
    export let presentDelegates: string[];
    export let maxHeight = "max-h-96";

    $: options = Array.from(presentDelegates)
        .filter(k => typeof delegates[k] !== "undefined")
        .map((k) => ({
            value: k,
            label: delegates[k].name,
            keywords: delegates[k].aliases.join(",")
        }) satisfies AutocompleteOption<string>);
</script>

<Autocomplete
    class="overflow-y-auto {maxHeight}"
    bind:input
    {options}
    on:selection
/>