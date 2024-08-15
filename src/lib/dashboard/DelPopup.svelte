<script lang="ts">
    import { Autocomplete, type AutocompleteOption, type PopupSettings } from "@skeletonlabs/skeleton";
    import type { DelegateAttrs } from "./types";

    export let popupID: string;
    export let input: string | undefined;
    export let delegates: Record<string, DelegateAttrs>;
    export let presentDelegates: string[];
    export let maxHeight = "max-h-96";

    $: options = Array.from(Object.entries(delegates), ([k, data]): AutocompleteOption<string> => ({
        value: k, label: data.name, keywords: data.aliases.join(",")
    }));
</script>
<script lang="ts" context="module">
    export function defaultPopupSettings(target: string): PopupSettings {
        return {
            event: 'focus-click',
            target,
            placement: 'bottom',
            middleware: {
                size: {
                    apply({availableHeight, elements}: any) {
                        Object.assign(elements.floating.style, {
                            maxHeight: `${availableHeight}px`,
                        });
                    },
                }
            }
        };
    }

    export function defaultPlaceholder(noDelegatesPresent: boolean) {
        return {
            disabled: noDelegatesPresent,
            placeholder: !noDelegatesPresent ? "Select a delegate..." : "No delegates present",
        };
    }
</script>

<div class="card overflow-hidden p-2" data-popup={popupID} tabindex="-1">
    <Autocomplete
      class="overflow-y-auto {maxHeight}"
      bind:input
      {options}
      allowlist={presentDelegates}
      on:selection
    />
</div>