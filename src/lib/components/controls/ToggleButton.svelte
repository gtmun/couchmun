<!--
  @component A wrapper around Skeleton's `SlideToggle` module 
  that adds a label that actually looks decent.

  `SlideToggle` on its own can be used, but this one looks nicer.
-->
<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLButtonElement> {
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
         * Label to use for accessibility.
         */
        label?: string,
        /**
         * Visual to put when inactive.
         */
        inactiveChild?: Snippet,
        /**
         * Visual to put when active.
         */
        activeChild?: Snippet
    }
    let {
        name,
        checked = $bindable(),
        disabled = false,
        label = undefined,
        inactiveChild,
        activeChild,
        class: extraClasses,
        ...rest
    }: Props = $props();
</script>

<button
    {name}
    type="button"
    aria-pressed={checked}
    onclick={() => checked = !checked}
    title={label}
    aria-label={label}
    class={[
        // Base
        "btn-icon-std aspect-square rounded-full cursor-pointer",
        "hover:brightness-90! dark:hover:brightness-110!",
        // Transitions
        "transition duration-200 ease-in-out",
        checked ? 'preset-filled-primary-500' : 'preset-filled-surface-200-800',
        // Disabled
        disabled && "opacity-50 cursor-not-allowed",
        extraClasses
    ]}
    {...rest}
>
    {#if checked}
        {@render activeChild?.()}
        {:else}
        {@render inactiveChild?.()}
    {/if}
</button>