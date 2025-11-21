<script lang="ts">
    import type { Snippet } from "svelte";

    import LabeledSwitch from "$lib/components/controls/LabeledSwitch.svelte";
    import type { InputComponentProps } from "$lib/motions/definitions";

    interface Props extends InputComponentProps<boolean> {
        label?: Snippet<[]>
    }
    let {
        name,
        value = $bindable(),
        label = undefined
    }: Props = $props();
</script>

<LabeledSwitch {name} bind:checked={value}>
    {#if label}
        {@render label()}
    {:else}
        <span>Extend previous motion?</span>
    {/if}
</LabeledSwitch>