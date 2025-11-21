<!--
  @component A wrapper around Skeleton's `SlideToggle` module 
  that adds a label that actually looks decent.

  `SlideToggle` on its own can be used, but this one looks nicer.
-->
<script lang="ts">
    import { Switch } from "@skeletonlabs/skeleton-svelte";
    import { type Snippet } from "svelte";

    import type { PropsOf } from "$lib/util";

    interface Props extends PropsOf<typeof Switch> {
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
        disabled?: boolean
    }
    let {
        children,
        name,
        checked = $bindable(),
        disabled = false,
        class: extraClasses,
        ...rest
    }: Props = $props();
</script>

<Switch
    {name}
    {checked}
    onCheckedChange={e => checked = e.checked}
    {disabled}
    {...rest}
    class={[
        "flex items-center justify-between gap-3 label",
        extraClasses
    ]}
>
    <Switch.Label class="text-base base-font-weight">
        {@render children()}
    </Switch.Label>
    <Switch.Control class="data-[state=checked]:preset-filled-primary-500">
        <Switch.Thumb />
    </Switch.Control>
    <Switch.HiddenInput />
</Switch>
