<script lang="ts">
    import type { DelegateAttrs } from "$lib/types";
    import DelAutocomplete from "$lib/components/del-input/DelAutocomplete.svelte";
    import { type PopupSettings } from "@skeletonlabs/skeleton";

    interface Props {
        popupID: string;
        input: string | undefined;
        delegates: Record<string, DelegateAttrs>;
        presentDelegates: string[];
        maxHeight?: string;
    }
    let {
        popupID,
        input = $bindable(),
        delegates,
        presentDelegates,
        maxHeight = "max-h-96"
    }: Props = $props();
</script>

<script lang="ts" module>
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
    <DelAutocomplete
        bind:input
        {delegates}
        {presentDelegates}
        {maxHeight}
        on:selection
    />
</div>