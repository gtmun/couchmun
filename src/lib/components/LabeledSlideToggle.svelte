<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
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

<!-- svelte-ignore a11y_label_has_associated_control : SlideToggle is a control -->
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