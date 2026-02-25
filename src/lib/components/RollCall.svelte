<script lang="ts">
    import { SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import { onMount, type Snippet } from "svelte";
    import type { ClassValue } from "svelte/elements";

    import DelLabel from "./del-label/DelLabel.svelte";
    import IconLabel from "./IconLabel.svelte";

    import type { Delegate } from "$lib/db/delegates";
    import type { PropsOf } from "$lib/util";

    interface Props {
        getValue?: (del: Delegate) => string | null,
        setValue?: (s: string | null, del: Delegate) => void,
        entries: readonly RollCallEntry[],
        delegates: Delegate[] & { pending?: true },
        emptyPlaceholder?: Snippet<[]>,
        pendingPlaceholder?: Snippet<[]>,
        borderColor?: ClassValue,
        rowColors?: [ClassValue, ClassValue],
    }
    let {
        getValue = undefined,
        setValue = undefined,
        entries,
        delegates,
        emptyPlaceholder = undefined,
        pendingPlaceholder = undefined,
        borderColor = "border-surface-200-800",
        rowColors = ["even:bg-surface-50-950", "odd:bg-surface-100-900"]
    }: Props = $props();

    // Force page to appear as pending for at least one tick
    // (to prevent loading lag from large delegate numbers).
    let notPending = $state(false);
    let dels = $derived(notPending ? delegates : Object.assign([], { pending: true } as const));
    onMount(() => {
        setTimeout(() => notPending = true, 1);
    });
</script>

<script module lang="ts">
    export function notPendingThen<T extends object>(t: T & { pending?: true }, cb: (t: T) => T): T & { pending?: true} {
        return t.pending ? t : cb(t);
    }

    export type RollCallEntry = {
        readonly value: string,
        readonly label: string, 
        readonly icon: PropsOf<typeof IconLabel>["icon"],
        readonly indicatorCls?: ClassValue,
        readonly disabled?: (del: Delegate) => boolean,
        readonly hidden?: () => boolean,
    };
</script>

{#if dels.pending}
    {#if pendingPlaceholder}
        {@render pendingPlaceholder()}
    {:else}
        <div class={["grid w-full border", borderColor]}>
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each Array.from({ length: 20 }) as _}
                <div class={["grid grid-cols-[2fr_1fr] h-18", rowColors]}>
                    <div class="flex items-center gap-1 p-4">
                        <div class="placeholder-circle size-6 animate-pulse"></div>
                        <div class="placeholder w-36 animate-pulse"></div>
                    </div>
                    <div
                        class="grid gap-4 p-4"
                        style:grid-template-columns="repeat({entries.length}, minmax(0, 1fr))"
                    >
                        {#each entries as { value } (value)}
                            <div class="placeholder animate-pulse"></div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
{:else if dels.length}
    <div class={["grid w-full border", borderColor]}>
        {#each dels as attrs (attrs.id)}
            <div class={["grid grid-cols-2", rowColors]}>
                <div class="flex items-center p-4">
                    <DelLabel {attrs} inline />
                </div>
                <div class="flex justify-end p-2">
                    <SegmentedControl
                        name="presence-{attrs.id}"
                        value={getValue?.(attrs)}
                        onValueChange={e => setValue?.(e.value, attrs)}
                    >
                        <SegmentedControl.Control>
                            <SegmentedControl.Context>
                                {#snippet children(segment)}
                                    {@const selected = segment().value}
                                    {@const indicatorCls = entries.find(k => k.value === selected)?.indicatorCls}
                                    <SegmentedControl.Indicator class={indicatorCls} />
                                    {#each entries as { value, label, icon, disabled, hidden } (value)}
                                        {#if !hidden?.()}
                                            <SegmentedControl.Item {value} class="hover:preset-tonal" disabled={disabled?.(attrs)}>
                                                <SegmentedControl.ItemText>
                                                    <IconLabel {icon} {label} />
                                                </SegmentedControl.ItemText>
                                                <SegmentedControl.ItemHiddenInput />
                                            </SegmentedControl.Item>
                                        {/if}
                                    {/each}
                                {/snippet}
                            </SegmentedControl.Context>
                        </SegmentedControl.Control>
                    </SegmentedControl>
                </div>
            </div>
        {/each}
    </div>
{:else}
    {@render emptyPlaceholder?.()}
{/if}