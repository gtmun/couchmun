<script lang="ts">
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { type Snippet } from "svelte";

    interface Props {
        children: Snippet,
        name: string,
        checked?: boolean,
        disabled?: boolean,
        labelClass?: string,
        [key: string]: any
    }
    let {
        children,
        name,
        checked = $bindable(undefined),
        disabled = undefined,
        labelClass = "flex items-center justify-between gap-3",
        ...rest
    }: Props = $props();
</script>

<label class={labelClass}>
    {@render children()}
    <SlideToggle 
        {name}
        bind:checked
        {disabled}
        active="bg-primary-500"
        {...rest}
    />
</label>