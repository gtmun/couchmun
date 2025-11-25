<!--
  @component The title text in the header.
-->
<script lang="ts">
    import type { ClassValue } from "svelte/elements";

    import { makeEditable } from "$lib/util/action.svelte";

    interface Props {
        /** Title text */
        title: string,
        /** Size of text (using Tailwind media sizes) */
        size?: "sm" | "md" | "lg",
        /** Additional properties to apply to the title */
        styles?: ClassValue,
        /** Whether the title is editable (by default, this is true) */
        editable?: boolean
    }

    let { title = $bindable(), size = "md", styles = "", editable = true }: Props = $props();
</script>

<h1
    class={[
        styles,
        "text-center break-all",
        "contenteditable:editable-std",
        (size == "lg") && "h1",
        (size == "md") && "h2",
        (size == "sm") && "h3",
    ]}
    use:makeEditable={{
        when: editable,
        get value() { return title },
        set value(text) { title = text }
    }}
>
    {title}
</h1>