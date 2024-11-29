<script lang="ts">
    import DelAutocomplete from "$lib/components/del-input/DelAutocomplete.svelte";
    import { type PopupSettings } from "@skeletonlabs/skeleton";
    import type { Delegate } from "$lib/db";

    interface Props {
        popupID: string;
        input: string | undefined;
        delegates: Delegate[];
        maxHeight?: string;
    }
    let {
        popupID,
        input = $bindable(),
        delegates,
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
        {maxHeight}
        on:selection
    />
</div>