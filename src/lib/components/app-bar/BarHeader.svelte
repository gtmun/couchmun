<!--
  @component The title text in the header.
-->
<script lang="ts">
    import { makeEditable } from "$lib/util";

    interface Props {
        /** Title text */
        title: string,
        /** Size of text (using Tailwind media sizes) */
        size?: "sm" | "md" | "lg",
        /** Additional properties to apply to the title */
        styles?: string,
        /** Whether the title is editable (by default, this is true) */
        editable?: boolean
    }

    let { title = $bindable(), size = "md", styles = "", editable = true }: Props = $props();
</script>


<h1 
    class="{styles} text-center break-all"
    class:h1={size == "lg"}
    class:h2={size == "md"}
    class:h3={size == "sm"}
    use:makeEditable={{
        when: editable,
        get value() { return title },
        set value(text) { title = text }
    }}
>
    {title}
</h1>