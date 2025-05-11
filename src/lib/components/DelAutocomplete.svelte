<!-- 
  @component A wrapper around Skeleton's `<Autocomplete>` component 
  that makes it easier to manage Delegate autocomplete.

  To create a Delegate autocomplete item, bound the `use:popup={autocompletePopup(POPUP_TARGET)}` 
  (from `popup.ts`) on the corresponding `input`.

  Then, create a popup with a `<DelAutocomplete>` component in it:
  ```svelte
    <div class="{POPUP_CARD_CLASSES}" data-popup={POPUP_TARGET}>
        <DelAutocomplete
            bind:input
            {delegates}
            on:selection={e => "actions to perform when item has been selected in autocomplete"}
        />
    </div>
  ```
-->

<script lang="ts">
    import type { Delegate } from "$lib/db/delegates";
    import { type AutocompleteOption } from "@skeletonlabs/skeleton-svelte";

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
         * Tailwind class representing the maximum height of the autocomplete box.
         */
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

<script lang="ts" module>
    /**
     * Defaults for an `<input>` element which triggers a delegate autocomplete.
     * @param noDelsPresent state indicating whether any delegates are present.
     * @returns the placeholders
     */
    export function autocompletePlaceholders(noDelsPresent: boolean) {
        return {
            disabled: noDelsPresent,
            placeholder: !noDelsPresent ? "Select a delegate..." : "No delegates present",
        };
    }
</script>

<Autocomplete
    class="overflow-y-auto {maxHeight}"
    bind:input
    {options}
    on:selection
/>