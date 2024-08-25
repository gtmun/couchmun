<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import { Autocomplete, type AutocompleteOption } from "@skeletonlabs/skeleton";

    export let input: string | undefined;
    export let delegates: Record<string, DelegateAttrs>;
    export let presentDelegates: string[];
    export let maxHeight = "max-h-96";

    $: options = Array.from(Object.entries(delegates), ([k, data]): AutocompleteOption<string> => ({
        value: k, label: data.name, keywords: data.aliases.join(",")
    }));
</script>

<Autocomplete
    class="overflow-y-auto {maxHeight}"
    bind:input
    {options}
    allowlist={presentDelegates}
    on:selection
/>