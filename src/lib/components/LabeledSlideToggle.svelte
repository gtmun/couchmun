<!--
  @component A wrapper around Skeleton's `SlideToggle` module 
  that adds a label that actually looks decent.

  `SlideToggle` on its own can be used, but this one looks nicer.
-->
<script lang="ts">
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { type Snippet } from "svelte";

    interface Props {
        /**
         * HTML for the label.
         */
        children: Snippet,
        /**
         * The name (as required by Skeleton's `SlideToggle`
         * and used for accessibility purposes)
         */
        name: string,
        /**
         * Whether the slide toggle is checked.
         * This is a bindable property.
         */
        checked?: boolean,
        /**
         * Whether this slide toggle is disabled.
         */
        disabled?: boolean,
        /**
         * The Tailwind CSS classes applied on the label.
         */
        labelClass?: string,
        [key: string]: any
    }
    let {
        children,
        name,
        checked = $bindable(undefined),
        disabled = undefined,
        labelClass = "flex items-center justify-between gap-3 label",
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